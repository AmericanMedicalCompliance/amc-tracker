// Cloudflare Pages Function: /functions/invite-user.js
// Creates a real Clerk invitation for a given email using Clerk's Backend API.
// The Clerk secret key stays server-side only (CLERK_SECRET_KEY env var) and is
// never sent to the browser. Clerk sends the invitation email itself.
// Called by the AMC Time Tracker admin Users page (sendInvite()).

export async function onRequestPost(context) {
  const { request, env } = context;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

try {
  const body = await request.json();
  const email = (body.email || '').trim().toLowerCase();
  const name = (body.name || '').trim();

  if (!email) {
    return new Response(JSON.stringify({ error: 'Email is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const secretKey = env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return new Response(JSON.stringify({ error: 'CLERK_SECRET_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const resp = await fetch('https://api.clerk.com/v1/invitations', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + secretKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email_address: email,
      redirect_url: 'https://tracker.amclms.com/',
      notify: true,
      ignore_existing: true,
      public_metadata: name ? { name: name } : undefined,
    }),
  });

  const data = await resp.json();

  if (!resp.ok) {
    const msg = (data.errors && data.errors[0] && data.errors[0].message) || 'Clerk invitation failed';
    return new Response(JSON.stringify({ error: msg, details: data }), {
      status: resp.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    ok: true,
    invitation: { id: data.id, status: data.status, email_address: data.email_address },
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
} catch (err) {
  return new Response(JSON.stringify({ error: err.message }), {
    status: 500,
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
  });
}
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
