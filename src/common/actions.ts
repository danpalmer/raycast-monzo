import { showToast, Toast } from "@raycast/api";
import { Monzo } from "@marceloclp/monzojs";

import { getClient } from "./monzo";

import "./fetch-patch";

export async function getAccounts(): Promise<Monzo.Accounts.Account[]> {
  const client = await getClient();
  const accounts = await client.getAccounts({});
  assertValue(accounts);
  return accounts.filter((account) => !account.closed);
}

export async function getBalance(account: Monzo.Accounts.Account): Promise<Monzo.Balance> {
  const client = await getClient();
  const balance = await client.getBalance({ accountId: account.id });
  assertValue(balance);
  return balance;
}

export function accountTitle(account: Monzo.Accounts.Account): string {
  switch (account.type) {
    case "uk_retail":
      return "Current Account";
    case "uk_retail_joint":
      return "Joint Account";
    case "uk_monzo_flex":
      return "Monzo Flex";
    case "uk_monzo_flex_backing_loan":
      return "Monzo Flex";
  }
}

function assertValue(value: any) {
  if (!value) {
    showToast({ style: Toast.Style.Animated, title: "Enable account access in the Monzo app to continue." });
    throw new Error("Could not contact Monzo");
  }
}
