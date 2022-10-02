import { useRef } from "react";
import { List, Action, ActionPanel, Color, Icon } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";

import { getAccountsAndPots } from "./lib/actions";
import { accountTitle } from "./lib/formatting";
import { PotItem } from "./components/pots";
import { AccountItem } from "./components/accounts";
import { TransactionsList } from "./components/transactions";

export default function Command() {
  const { isLoading, data: accountPots } = useCachedPromise(
    getAccountsAndPots,
    [],
    {}
  );

  if (!accountPots) {
    if (isLoading) {
      // Loading or authenticating, not visible for long.
      return null;
    } else {
      return (
        <List>
          <List.EmptyView
            icon={{ source: Icon.Warning, tintColor: Color.Yellow }}
            title="No Monzo access"
            description="Open the Monzo app to allow Raycast to access your accounts."
          />
        </List>
      );
    }
  }

  return (
    <List
      enableFiltering
      isLoading={isLoading}
      searchBarPlaceholder="Search accounts and pots"
      isShowingDetail
    >
      {accountPots?.map(({ account, pots }) => (
        <List.Section key={account.id} title={accountTitle(account)}>
          <AccountItem
            key={account.id}
            account={account}
            actions={
              <ActionPanel>
                <Action.Push
                  title="Show transactions"
                  target={<TransactionsList account={account} />}
                />
              </ActionPanel>
            }
          />
          {pots.map((pot) => (
            <PotItem key={pot.id} pot={pot} />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
