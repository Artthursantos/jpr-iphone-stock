import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizeText(value: string | undefined) {
  return value?.trim() ?? '';
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

async function getGoogleServiceAccountCredentials() {
  const raw = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
  if (!raw) throw new Error('Variável GOOGLE_SERVICE_ACCOUNT_JSON não definida nos secrets do Supabase.');
  return JSON.parse(raw);
}

async function getGoogleAccessToken(credentials: any, scope: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: scope,
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const json = await req.json().catch(() => ({}));
    const sheetId = normalizeText(json.sheetId);
    const sheetTitle = normalizeText(json.sheetTitle);
    const produto = normalizeText(json.produto);
    const armazenamento = normalizeText(json.armazenamento);
    const cores = normalizeText(json.cores);
    const newPrice = json.newPrice;

    if (!sheetId || !sheetTitle || !produto || newPrice === undefined) {
      throw new Error('Parâmetros obrigatórios faltando: sheetId, sheetTitle, produto, newPrice');
    }

    const credentials = await getGoogleServiceAccountCredentials();
    const token = await getGoogleAccessToken(credentials, 'https://www.googleapis.com/auth/spreadsheets');

    // Fetch all sheet values
    const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(sheetTitle)}?majorDimension=ROWS`;
    const valuesRes = await fetch(valuesUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!valuesRes.ok) {
      throw new Error(`Falha ao buscar valores da planilha: ${valuesRes.status}`);
    }

    const data = await valuesRes.json();
    const rows = data.values || [];

    if (rows.length < 2) {
      throw new Error('A planilha não contém dados suficientes.');
    }

    // Find matching row
    // Column indices: [4] = E (produto), [7] = H (armazenamento), [5] = F (cores)
    let targetRowIndex = -1;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowProduto = normalizeText(row[4]);
      const rowArmazenamento = normalizeText(row[7]);
      const rowCores = normalizeText(row[5]);

      if (
        rowProduto.toLowerCase() === produto.toLowerCase() &&
        (armazenamento ? rowArmazenamento.toLowerCase() === armazenamento.toLowerCase() : true) &&
        (cores ? rowCores.toLowerCase() === cores.toLowerCase() : true)
      ) {
        targetRowIndex = i;
        break;
      }
    }

    if (targetRowIndex === -1) {
      throw new Error(`Produto "${produto}" não encontrado na planilha.`);
    }

    // Update the price cell (column K = index 10)
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(sheetTitle)}!K${targetRowIndex + 1}?valueInputOption=RAW`;
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [[newPrice]],
      }),
    });

    if (!updateRes.ok) {
      const errorText = await updateRes.text();
      throw new Error(`Falha ao atualizar célula: ${updateRes.status} ${errorText}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        updatedRow: targetRowIndex + 1,
        produto,
        newPrice,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Erro no google-sheet-price-update:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message ?? String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
