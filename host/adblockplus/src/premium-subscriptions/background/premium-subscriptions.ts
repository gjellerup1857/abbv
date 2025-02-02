/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-present eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as ewe from "@eyeo/webext-ad-filtering-solution";

import { addSubscription } from "../../../adblockpluschrome/lib/filterConfiguration";
import * as premium from "../../premium/background";
import {
  ANNOYANCE_SUBSCRIPTION_TYPE,
  COOKIES_PREMIUM_SUBSCRIPTION_TYPE,
  premiumTypes,
  type PremiumSubscriptionType,
  type PremiumSubscriptionsState
} from "../shared";
import { port } from "~/core/messaging/background";
import {
  type Message,
  isPremiumSubscriptionsAddRemoveOptions
} from "../../core/messaging/shared";

/**
 * Returns a list of premium subscriptions.
 *
 * @returns A list of premium subscriptions
 */
function getPremiumSubscriptions(): ewe.Recommendation[] {
  // The subscription of the "annoyances" type is the DC subscription
  return ewe.subscriptions
    .getRecommendations()
    .filter(({ type }) => premiumTypes.has(type));
}

/**
 * Adds premium subscriptions that should be installed by default.
 *
 * @returns A Promise that settles after the process of adding
 * the subscriptions gets fulfilled or rejected
 */
async function addOptoutPremiumSubscriptions(): Promise<void> {
  const subscriptions = getPremiumSubscriptions();

  for (const subscription of subscriptions) {
    if (
      !(await ewe.subscriptions.has(subscription.url)) &&
      subscription.type === "annoyances"
    ) {
      await addSubscription(subscription);
      break;
    }
  }
}

/**
 * Removes all premium subscriptions.
 *
 * @returns A Promise that settles after the process of removing
 * the subscriptions gets fulfilled or rejected
 */
async function removePremiumSubscriptions(): Promise<void> {
  const subscriptions = getPremiumSubscriptions();

  for (const subscription of subscriptions) {
    if (await ewe.subscriptions.has(subscription.url)) {
      await ewe.subscriptions.remove(subscription.url);
    }
  }
}

export function computePremiumState(
  premiumSubscriptions: ewe.Recommendation[],
  activeSubscriptions: ewe.Subscription[]
): PremiumSubscriptionsState {
  const annoyanceSubscriptionId = premiumSubscriptions.find(
    (sub) => sub.type === ANNOYANCE_SUBSCRIPTION_TYPE
  )?.id;
  const cookiesPremiumSubscriptionId = premiumSubscriptions.find(
    (sub) => sub.type === COOKIES_PREMIUM_SUBSCRIPTION_TYPE
  )?.id;

  return {
    [ANNOYANCE_SUBSCRIPTION_TYPE]: activeSubscriptions.some(
      (sub: ewe.Subscription) =>
        sub.id === annoyanceSubscriptionId && sub.enabled
    ),
    [COOKIES_PREMIUM_SUBSCRIPTION_TYPE]: activeSubscriptions.some(
      (sub: ewe.Subscription) =>
        sub.id === cookiesPremiumSubscriptionId && sub.enabled
    )
  };
}

export async function addPremiumSubscription(
  type: PremiumSubscriptionType
): Promise<void> {
  const subscription = getPremiumSubscriptions().find(
    (sub) => sub.type === type
  );

  if (subscription !== undefined) {
    await addSubscription(subscription);
    void ewe.subscriptions.enable(subscription.url);
  }
}

export async function removePremiumSubscription(
  type: PremiumSubscriptionType
): Promise<void> {
  const subscription = getPremiumSubscriptions().find(
    (sub) => sub.type === type
  );

  if (subscription === undefined) {
    return;
  }

  const hasSubscription = await ewe.subscriptions.has(subscription.url);

  if (hasSubscription) {
    void ewe.subscriptions.remove(subscription.url);
  }
}

export async function getPremiumSubscriptionsState(): Promise<{
  [ANNOYANCE_SUBSCRIPTION_TYPE]: boolean;
  [COOKIES_PREMIUM_SUBSCRIPTION_TYPE]: boolean;
}> {
  const premiumSubscriptions = getPremiumSubscriptions();
  const activeSubscriptions = await ewe.subscriptions.getSubscriptions();
  return computePremiumState(premiumSubscriptions, activeSubscriptions);
}

/**
 * Initializes Premium subscriptions in the background context.
 */
export function start(): void {
  premium.emitter.on("deactivated", () => {
    void removePremiumSubscriptions();
  });

  premium.emitter.on("activated", () => {
    void addOptoutPremiumSubscriptions();
  });

  port.on("premium.subscriptions.add", (msg: Message) => {
    if (
      msg.type !== "premium.subscriptions.add" ||
      !isPremiumSubscriptionsAddRemoveOptions(msg)
    ) {
      return;
    }

    void addPremiumSubscription(msg.subscriptionType);
  });

  port.on("premium.subscriptions.remove", async (msg: Message) => {
    if (
      msg.type !== "premium.subscriptions.remove" ||
      !isPremiumSubscriptionsAddRemoveOptions(msg)
    ) {
      return;
    }

    await removePremiumSubscription(msg.subscriptionType);
  });

  port.on("premium.subscriptions.getState", async (msg: Message) => {
    if (msg.type !== "premium.subscriptions.getState") {
      return;
    }

    const state = await getPremiumSubscriptionsState();
    return state;
  });
}
