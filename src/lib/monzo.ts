import fetch from "node-fetch";
import { OAuth } from "@raycast/api";
import MonzoClient from "@marceloclp/monzojs";
import { IMonzoClient } from "@marceloclp/monzojs/lib/types/client";

const clientId = "oauth2client_0000AO8OyONgEXthlFQNPN";
const authorizeUrl = "https://oauth-pkce-proxy-monzo.fly.dev/oauth/authorize";
const tokenUrl = "https://oauth-pkce-proxy-monzo.fly.dev/oauth/access_token";
const refreshUrl = "https://oauth-pkce-proxy-monzo.fly.dev/oauth/refresh";

const client = new OAuth.PKCEClient({
  redirectMethod: OAuth.RedirectMethod.Web,
  providerName: "Monzo",
  providerId: "monzo",
  providerIcon: "monzo_transparent.png",
  description: "Connect your Monzo account...",
});

export async function getClient(): Promise<IMonzoClient> {
  const tokenSet = await client.getTokens();

  // If no access token, auth and try again.
  if (!tokenSet || !tokenSet.accessToken) {
    await initAuth();
    return getClient();
  }

  // If needs refresh, refresh and try again
  if (tokenSet.refreshToken && tokenSet.isExpired()) {
    await client.setTokens(await refreshTokens(tokenSet?.refreshToken));
    return getClient();
  }

  // If no refresh token, something has gone wrong
  if (!tokenSet.refreshToken) {
    throw new Error("No refresh token");
  }

  return MonzoClient(tokenSet.accessToken);
}

async function initAuth() {
  console.log("Starting authentication");
  const authRequest = await client.authorizationRequest({
    endpoint: authorizeUrl,
    clientId: clientId,
    scope: "",
  });
  console.log("Requesting authorization");
  const { authorizationCode } = await client.authorize(authRequest);
  console.log("Received authorization");
  console.log("Fetching tokens");
  const tokens = await fetchTokens(authRequest, authorizationCode);
  console.log("Received tokens");
  await client.setTokens(tokens);
  console.log("Persisted tokens");
}

async function fetchTokens(
  authRequest: OAuth.AuthorizationRequest,
  authorizationCode: string
): Promise<OAuth.TokenResponse> {
  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("code", authorizationCode);
  params.append("code_verifier", authRequest.codeVerifier);
  params.append("grant_type", "authorization_code");
  params.append("redirect_uri", authRequest.redirectURI);
  const response = await fetch(`${tokenUrl}?${params.toString()}`, {
    method: "POST",
  });
  if (!response.ok) {
    console.error("Error completing sign-in:", await response.text());
    throw new Error(response.statusText);
  }
  return (await response.json()) as OAuth.TokenResponse;
}

async function refreshTokens(
  refreshToken: string
): Promise<OAuth.TokenResponse> {
  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("refresh_token", refreshToken);
  params.append("grant_type", "refresh_token");
  const response = await fetch(`${refreshUrl}?${params.toString()}`, {
    method: "POST",
  });
  if (!response.ok) {
    console.error("Error refreshing access:", await response.text());
    throw new Error(response.statusText);
  }
  const tokenResponse = (await response.json()) as OAuth.TokenResponse;
  tokenResponse.refresh_token = tokenResponse.refresh_token ?? refreshToken;
  return tokenResponse;
}
