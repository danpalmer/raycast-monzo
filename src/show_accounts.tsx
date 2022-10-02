import { useRef } from "react";
import { List, Action, ActionPanel } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";

import { getPots } from "./lib/actions";
import { accountTitle } from "./lib/formatting";
import { PotItem } from "./components/pots";
import { AccountItem } from "./components/accounts";
import { TransactionsList } from "./components/transactions";

export default function Command() {
  const abortable = useRef<AbortController>();
  const { isLoading, data: accountPots } = useCachedPromise(getPots, [], {
    abortable,
  });
  return (
    <List enableFiltering isLoading={isLoading} searchBarPlaceholder="Search accounts and pots" isShowingDetail>
      {accountPots?.map(({ account, pots }) => (
        <List.Section key={account.id} title={accountTitle(account)}>
          <AccountItem
            key={account.id}
            account={account}
            actions={
              <ActionPanel>
                <Action.Push title="Show transactions" target={<TransactionsList account={account} />} />
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
