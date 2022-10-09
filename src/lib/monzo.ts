import fetch from "node-fetch";
import { OAuth, getPreferenceValues } from "@raycast/api";
import MonzoClient from "@marceloclp/monzojs";
import { IMonzoClient } from "@marceloclp/monzojs/lib/types/client";

const authorizeUrl = "https://oauth-pkce-proxy-public.fly.dev/authorize";
const tokenUrl = "https://oauth-pkce-proxy-public.fly.dev/access_token";

const monzoAuthorizeUri = "https://auth.monzo.com/";
const monzoAccessTokenUri = "https://api.monzo.com/oauth2/token";

const client = new OAuth.PKCEClient({
  redirectMethod: OAuth.RedirectMethod.Web,
  providerName: "Monzo",
  providerId: "monzo",
  providerIcon: "monzo_transparent.png",
  description: "Connect your Monzo account...",
});

interface Preferences {
  oauthClientId: string;
  oauthClientSecret: string;
}

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
  const preferences = getPreferenceValues<Preferences>();
  const authRequest = await client.authorizationRequest({
    endpoint: authorizeUrl,
    clientId: preferences.oauthClientId.trim(),
    scope: "",
    extraParameters: { x_authorize_url: monzoAuthorizeUri },
  });
  console.log(authRequest);
  const { authorizationCode } = await client.authorize(authRequest);
  console.log("Got auth code", authorizationCode);
  const tokens = await fetchTokens(authRequest, authorizationCode);
  console.log("Got tokens", tokens);
  await client.setTokens(tokens);
}

async function fetchTokens(
  authRequest: OAuth.AuthorizationRequest,
  authorizationCode: string
): Promise<OAuth.TokenResponse> {
  const preferences = getPreferenceValues<Preferences>();
  console.log(authRequest.redirectURI);
  const data = new URLSearchParams();
  data.append("client_id", preferences.oauthClientId.trim());
  data.append("code", authorizationCode);
  data.append("code_verifier", authRequest.codeVerifier);
  data.append("grant_type", "authorization_code");
  data.append("redirect_uri", authRequest.redirectURI);

  data.append("x_client_secret", preferences.oauthClientSecret.trim());
  data.append("x_access_token_uri", monzoAccessTokenUri);

  const response = await fetch(tokenUrl, {
    method: "POST",
    body: data,
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
  const preferences = getPreferenceValues<Preferences>();

  const data = new URLSearchParams();
  data.append("client_id", preferences.oauthClientId.trim());
  data.append("refresh_token", refreshToken);
  data.append("grant_type", "refresh_token");
  data.append("client_secret", preferences.oauthClientSecret.trim());

  const response = await fetch(monzoAccessTokenUri, {
    method: "POST",
    body: data,
  });

  if (!response.ok) {
    console.error("Error refreshing access:", await response.text());
    throw new Error(response.statusText);
  }

  const tokenResponse = (await response.json()) as OAuth.TokenResponse;
  tokenResponse.refresh_token = tokenResponse.refresh_token ?? refreshToken;
  return tokenResponse;
}
