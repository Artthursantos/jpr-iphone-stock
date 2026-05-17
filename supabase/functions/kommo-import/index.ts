import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Tratamento de CORS pré-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const kommoToken = Deno.env.get('KOMMO_ACCESS_TOKEN');
    if (!kommoToken) {
      throw new Error('Chave KOMMO_ACCESS_TOKEN n\u00A0o est\u00E1 configurada nos secrets do Supabase.');
    }

    // Buscar os últimos 250 leads atualizados na Kommo junto com os relacionamentos de contatos
    // Filtrado pelo Funil de Vendas (Pipeline ID: 9515844)
    const kommoUrl = "https://sealstore.kommo.com/api/v4/leads?filter[pipeline_id][0]=9515844&limit=250&with=custom_fields_values,contacts&order[updated_at]=desc";
    const response = await fetch(kommoUrl, {
      headers: {
        'Authorization': `Bearer ${kommoToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
       throw new Error(`Erro na API Kommo (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    const leadsData = data._embedded?.leads || [];

    // Mapear IDs de contatos dos leads para buscar os nomes reais
    const contactIds = new Set<string>();
    leadsData.forEach((lead: any) => {
       const contacts = lead._embedded?.contacts;
       if (contacts && contacts.length > 0) {
          contactIds.add(String(contacts[0].id));
       }
    });

    // Buscar nomes dos contatos
    const contactsMap = new Map<string, string>();
    if (contactIds.size > 0) {
       const idsArray = Array.from(contactIds);
       for (let i = 0; i < idsArray.length; i += 50) {
           const chunk = idsArray.slice(i, i + 50);
           const params = chunk.map((id, idx) => `filter[id][${idx}]=${id}`).join('&');
           const contactsUrl = `https://sealstore.kommo.com/api/v4/contacts?${params}&limit=250`;
           
           const contactsRes = await fetch(contactsUrl, {
              headers: {
                 'Authorization': `Bearer ${kommoToken}`,
                 'Accept': 'application/json'
              }
           });
           
           if (contactsRes.ok) {
              const contactsData = await contactsRes.json();
              const contactsList = contactsData._embedded?.contacts || [];
              contactsList.forEach((c: any) => {
                 contactsMap.set(String(c.id), c.name);
              });
           }
       }
    }

    // Processar campos da kommo
    const processedLeads = leadsData.map((lead: any) => {
       let modelo_desejado = "";
       let modelo_entrada = "";
       let armazenamento_desejado = "";
       let armazenamento_entrada = "";
       let orcamento = lead.price || 0;
       
       let urgencia = "longo_prazo";
       let temperatura = "frio";
       let interesse = "comprar_seminovo";
       let stageValue = ""; // capture stage/etapa field when present

       if (lead.custom_fields_values) {
          for (const field of lead.custom_fields_values) {
              const name = field.field_name?.toLowerCase() || "";
              const valObj = field.values && field.values.length > 0 ? field.values[0] : null;
              if (!valObj) continue;
              
              // Kommo retorna frequentemente o texto em enum_code ou value
              const value = String(valObj.value || valObj.enum_code || "").toLowerCase();
              
              // Capture possible stage/etapa fields
              if (name.includes("etapa") || name.includes("stage") || name.includes("etapa de")) {
                stageValue = String(valObj.value || valObj.enum_code || "").toLowerCase();
              }

              if (name === "modelo de aparelho") modelo_desejado = String(valObj.value);
              else if (name === "modelo atual" || name === "aparelho de entrada") modelo_entrada = String(valObj.value);
              else if (name.includes("urg\u00EAncia")) {
                if (value.includes("imediata")) urgencia = "imediata";
                else if (value.includes("curto")) urgencia = "curto_prazo";
              }
              else if (name.includes("temperatura")) {
                if (value.includes("quente")) temperatura = "quente";
                else if (value.includes("morno")) temperatura = "morno";
              }
              else if (name.includes("interesse")) interesse = String(valObj.value);
          }
       }

       const statusName = String(lead.status_name || lead.status?.name || "").toLowerCase();
      const statusId = String(lead.status_id || lead.status?.id || "");
      const closedWonId = Deno.env.get("KOMMO_STATUS_WON_ID") || "142";
      const closedLostId = Deno.env.get("KOMMO_STATUS_LOST_ID") || "143";

       // If stage/status indicates closed-won or closed-lost, skip lead
       if (stageValue && (stageValue.includes("venda ganha") || stageValue.includes("venda perdida"))) {
         return null;
       }
       if (statusName && (statusName.includes("venda ganha") || statusName.includes("venda perdida"))) {
         return null;
       }
       if ((closedWonId && statusId === closedWonId) || (closedLostId && statusId === closedLostId)) {
         return null;
       }

       // Se n\u00A0o tem modelo_desejado, skipamos o lead porque n\u00A0o \u00E9 de iphone especificamente
       if (!modelo_desejado) return null;

       const tipo = modelo_entrada && modelo_entrada.length > 0 ? 'trade_in' : 'comprador';
       
       // Pegar nome verdadeiro do Contato se existir, senão usa o nome do Lead
       let nome_final = lead.name || 'Lead sem nome';
       const firstContactId = lead._embedded?.contacts?.[0]?.id;
       if (firstContactId && contactsMap.has(String(firstContactId))) {
           const contactName = contactsMap.get(String(firstContactId));
           if (contactName && contactName.trim() !== '') {
               nome_final = contactName;
           }
       }

       return {
         kommo_lead_id: String(lead.id),
         nome: nome_final,
         modelo_desejado: modelo_desejado,
         modelo_entrada: modelo_entrada || null,
         armazenamento_desejado: armazenamento_desejado || null,
         armazenamento_entrada: armazenamento_entrada || null,
         interesse: interesse,
         tipo: tipo,
         orcamento: orcamento,
         urgencia: urgencia,
         temperatura: temperatura,
         origem: 'Kommo Integrado',
         status: 'ativo'
       };
    }).filter(Boolean);

    let inserted = 0;
    
    // Fazer upsert no banco usando kommo_lead_id
    if (processedLeads.length > 0) {
      const { error } = await supabaseClient
        .from('leads')
        .upsert(processedLeads, { onConflict: 'kommo_lead_id' });
        
      if (error) throw error;
      inserted = processedLeads.length;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Sincronizados ${inserted} leads com a Kommo!`,
        total_found: leadsData.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error("Erro no Webhook:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
