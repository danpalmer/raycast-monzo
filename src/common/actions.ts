import { showToast, Toast } from "@raycast/api";
import { Monzo } from "@marceloclp/monzojs";

import { getClient } from "./monzo";

import "./fetch-patch";

export async function getBalances(): Promise<any> {
  const client = await getClient();
  const accounts = (await client.getAccounts({})).filter((account) => !account.closed);
  if (!accounts) {
    showToast({ style: Toast.Style.Animated, title: "Enable account access in the Monzo app to continue." });
    return [];
  }

  const balances = await Promise.all(accounts.map((account) => client.getBalance({ accountId: account.id })));

  return accounts.map((account, idx) => ({ details: account, balance: balances[idx] }));
}

export interface Account {
  details: Monzo.Accounts.Account;
  balance: Monzo.Balance;
}

export function accountTitle(account: Account): string {
  console.log(account);
  switch (account.details.type) {
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
