import { showToast, Toast, confirmAlert } from "@raycast/api";
import { Monzo } from "@marceloclp/monzojs";

import { getClient } from "./monzo";
import { formatCurrency } from "./formatting";

import "./fetch_patch";

export async function getAccountsAndPots(): Promise<AccountPots[]> {
  const client = await getClient();
  let accounts = await client.getAccounts({});
  assertValue(accounts);
  accounts = accounts.filter((account) => !account.closed);
  const potsByAccount = await Promise.all(
    accounts.map((account) => client.getPots({ accountId: account.id }))
  );
  return potsByAccount.map((pots, idx) => {
    pots = pots.filter((pot) => !pot.deleted);
    return { pots, account: accounts[idx] };
  });
}

export async function getBalance(
  account: Monzo.Accounts.Account
): Promise<Monzo.Balance> {
  const client = await getClient();
  const balance = await client.getBalance({ accountId: account.id });
  assertValue(balance);
  return balance;
}

export async function getTransactions(
  account: Monzo.Accounts.Account
): Promise<Monzo.Transactions.ExpandedTransaction<["merchant"]>[]> {
  const client = await getClient();
  const ninetyDays = 1000 * 60 * 60 * 24 * 90;
  const since = new Date(Date.now() - ninetyDays);
  const transactions = await client.getTransactions({
    accountId: account.id,
    expand: ["merchant"],
    since: since.toISOString(),
  });
  assertValue(transactions);
  return transactions.reverse();
}

export async function transferMoney(
  source: string,
  destination: string,
  amount: number,
  attemptToken: string
): Promise<boolean> {
  const confirmed = await confirmAlert({
    title: `Are you sure you want to transfer ${formatCurrency(amount, "GBP")}`,
  });
  const client = await getClient();

  if (source.startsWith("pot_") && destination.startsWith("acc_")) {
    await client.withdrawFromPot({
      potId: source,
      accountId: destination,
      dedupeId: attemptToken,
      amount,
    });
  } else if (source.startsWith("acc_") && destination.startsWith("pot_")) {
    await client.depositIntoPot({
      accountId: source,
      potId: destination,
      dedupeId: attemptToken,
      amount,
    });
  }

  return confirmed;
}

export interface AccountPots {
  account: Monzo.Accounts.Account;
  pots: Monzo.Pot[];
}

function assertValue(
  value:
    | Monzo.Pot[]
    | Monzo.Balance
    | Monzo.Accounts.Account[]
    | Monzo.Transactions.ExpandedTransaction<["merchant"]>[]
) {
  if (!value) {
    showToast({
      style: Toast.Style.Animated,
      title: "Enable account access in the Monzo app to continue.",
    });
    throw new Error("Could not contact Monzo");
  }
}
