import { useRef, FC } from "react";
import { List } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { Monzo } from "@marceloclp/monzojs";

import { getPots } from "./common/actions";
import { formatCurrency, accountTitle } from "./common/formatting";

export default function Command() {
  const abortable = useRef<AbortController>();
  const { isLoading, data: accountPots } = useCachedPromise(getPots, [], {
    abortable,
  });
  return (
    <List enableFiltering={true} isLoading={isLoading} isShowingDetail>
      {accountPots?.map(({ account, pots }) => (
        <List.Section key={account.id} title={accountTitle(account)}>
          {pots.map((pot) => (
            <PotItem key={pot.id} pot={pot} />
          ))}
        </List.Section>
      ))}
    </List>
  );
}

type PotProps = { pot: Monzo.Pot };

const PotItem: FC<PotProps> = ({ pot }) => {
  console.log(pot);
  return <List.Item title={pot.name} detail={<PotDetail pot={pot} />} />;
};

const PotDetail: FC<PotProps> = ({ pot }) => {
  return (
    <List.Item.Detail
      markdown={`![](${pot.cover_image_url})`}
      metadata={
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label title="Balance" text={formatCurrency(pot.balance)} />
          {pot.goal_amount && <List.Item.Detail.Metadata.Label title="Goal" text={formatCurrency(pot.goal_amount)} />}
          <List.Item.Detail.Metadata.Separator />
          {pot.round_up && <List.Item.Detail.Metadata.Label title="Rounding up into this pot" />}
        </List.Item.Detail.Metadata>
      }
    />
  );
};
