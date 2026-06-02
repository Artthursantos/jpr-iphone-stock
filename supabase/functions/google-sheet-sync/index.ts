import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizeText(value: string | undefined) {
  return value?.trim() ?? '';
}


function mapRowToRecord(row: any[], _rowIndex: number): Record<string, any> | null {
  if (!row || row.length < 7) return null;

  // Estrutura da planilha "Tabela de Preço - 2026" (coluna D "Status" foi removida):
  // [0] A: (vazio)
  // [1] B: Fornecedor (ex: "Seal", "Rex") → revendedor
  // [2] C: Prazo (ex: "pronta entrega") - ignorado
  // [3] D: Nome do Produto (ex: "iPhone 13 Midnight - 84%") → produto
  // [4] E: Cores (ex: "Midnight", "Branco") → cores
  // [5] F: Categoria (ex: "Seminovo", "Novo") → novo_seminovo
  // [6] G: Armazenamento (ex: "128GB", "256GB") → armazenamento
  // [7] H: Custo → custo
  // [8] I: Valor de Venda - Sugerido - ignorado
  // [9] J: À Vista (ex: "R$ 2.597,00") → preco

  const revendedor    = normalizeText(row[1]);
  const produto       = normalizeText(row[3]);
  const cores         = normalizeText(row[4]);
  const novoSeminovo  = normalizeText(row[5]);
  const armazenamento = normalizeText(row[6]);
  const custo         = row.length > 7 ? normalizeText(row[7]) : '';
  const aVista        = row.length > 9 ? normalizeText(row[9]) : '';

  // Apenas linhas com categoria válida (Novo ou Seminovo)
  const categoriaLower = novoSeminovo.toLowerCase();
  if (categoriaLower !== 'novo' && categoriaLower !== 'seminovo') return null;
  if (!produto) return null;

  return {
    produto,
    armazenamento: armazenamento || null,
    novo_seminovo: novoSeminovo,
    cores: cores || null,
    revendedor: revendedor || null,
    custo: custo || null,
    preco: aVista || null,
    atualized_at: new Date().toISOString(),
  };
}

async function getGoogleServiceAccountCredentials() {
  const raw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
  if (!raw) throw new Error('Variável GOOGLE_SERVICE_ACCOUNT_JSON não definida nos secrets do Supabase.');
  return JSON.parse(raw);
}

function base64UrlEncode(value: Uint8Array) {
  const base64 = btoa(String.fromCharCode(...value));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signJwt(privateKey: string, data: Uint8Array) {
  const pem = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');

  const binary = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binary.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, data);
  return base64UrlEncode(new Uint8Array(signature));
}

async function getGoogleAccessToken(credentials: any) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signatureInput = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
  const signature = await signJwt(credentials.private_key, signatureInput);
  const jwt = `${encodedHeader}.${encodedPayload}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Falha ao obter token do Google: ${tokenRes.status} ${text}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

async function fetchSheetValues(sheetId: string, sheetTitle?: string) {
  const credentials = await getGoogleServiceAccountCredentials();
  const token = await getGoogleAccessToken(credentials);

  const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}?fields=sheets.properties.title`;
  const metadataRes = await fetch(metadataUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!metadataRes.ok) {
    throw new Error(`Falha ao buscar metadados da planilha: ${metadataRes.status}`);
  }

  const metadata = await metadataRes.json();
  const sheets = metadata.sheets || [];
  if (sheets.length === 0) {
    throw new Error('A planilha não contém abas.');
  }

  const availableTitles = sheets.map((sheet: any) => sheet.properties?.title).filter(Boolean);
  const effectiveTitle = sheetTitle && availableTitles.includes(sheetTitle)
    ? sheetTitle
    : availableTitles[0];

  const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(effectiveTitle)}?majorDimension=ROWS`;
  const valuesRes = await fetch(valuesUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!valuesRes.ok) {
    throw new Error(`Falha ao buscar valores da planilha: ${valuesRes.status}`);
  }

  return {
    sheetTitle: effectiveTitle,
    data: await valuesRes.json(),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const json = await req.json().catch(() => ({}));
    const sheetId = normalizeText(json.sheetId || json.sheet_id || Deno.env.get('GOOGLE_SHEET_ID'));
    const sheetTitle = normalizeText(json.sheetTitle || json.sheet_title || Deno.env.get('GOOGLE_SHEET_TITLE'));
    const debugMode = json.debug === true;

    if (!sheetId) {
      throw new Error('sheetId não foi definido na requisição ou no ambiente.');
    }

    const { sheetTitle: resolvedTitle, data } = await fetchSheetValues(sheetId, sheetTitle || undefined);
    const rows = data.values || [];
    if (rows.length < 2) {
      throw new Error('A planilha não contém dados suficientes para sincronizar.');
    }

    if (debugMode) {
      return new Response(
        JSON.stringify({
          success: true,
          debug: true,
          sheetTitle: resolvedTitle,
          totalRows: rows.length,
          firstRow: rows[0],
          nextRows: rows.slice(1, 6),
          firstRowMapped: mapRowToRecord(rows[1], 0),
          secondRowMapped: mapRowToRecord(rows[2], 1),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const records = rows.slice(1).map((row, index) => mapRowToRecord(row, index)).filter(Boolean);

    if (records.length === 0) {
      // Retorna diagnóstico das primeiras linhas para facilitar debugging
      const sample = rows.slice(1, 6).map((r: any[]) => r.slice(0, 12));
      throw new Error(`Nenhum produto válido encontrado. Título da aba: "${resolvedTitle}". Primeiras colunas: ${JSON.stringify(sample[0])}`);
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Apaga todos os registros antes de reinserir para evitar duplicatas
    const { error: deleteError } = await supabaseClient
      .from('produtos')
      .delete()
      .neq('id', 0);

    if (deleteError) throw deleteError;

    const { error } = await supabaseClient
      .from('produtos')
      .insert(records);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        sheetTitle: resolvedTitle,
        insertedRows: records.length,
        totalSourceRows: rows.length,
        sampleRecords: records.slice(0, 2),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Erro no google-sheet-sync:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message ?? String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
