import { showToast, Toast } from "@raycast/api";
import { Monzo } from "@marceloclp/monzojs";

import { getClient } from "./monzo";

import "./fetch_patch";

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

export async function getPots(): Promise<AccountPots[]> {
  const client = await getClient();
  let accounts = await client.getAccounts({});
  assertValue(accounts);
  accounts = accounts.filter((account) => !account.closed);
  const potsByAccount = await Promise.all(accounts.map((account) => client.getPots({ accountId: account.id })));
  const x = potsByAccount.map((pots, idx) => {
    pots = pots.filter((pot) => !pot.deleted);
    return { pots, account: accounts[idx] };
  });
  return x.concat(x);
}

interface AccountPots {
  account: Monzo.Accounts.Account;
  pots: Monzo.Pot[];
}

function assertValue(value: any) {
  if (!value) {
    showToast({ style: Toast.Style.Animated, title: "Enable account access in the Monzo app to continue." });
    throw new Error("Could not contact Monzo");
  }
}
