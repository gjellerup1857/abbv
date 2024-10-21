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

import * as dialogModule from "./dialog";
import { type Dialog } from "./dialog.types";
import { showOnpageDialog } from "./tab-manager";
import { ShowOnpageDialogResult } from "./tab-manager.types";
import * as timing from "./timing";
import { Timing } from "./timing.types";
import { type Tabs } from "webextension-polyfill";

jest.mock("../../../adblockpluschrome/lib/prefs", () => {
  const prefsData: Record<string, any> = {
    onpage_dialog_command_stats: []
  };

  return {
    Prefs: {
      notifications: {
        getIgnoredCategories: jest.fn().mockResolvedValue([])
      },
      get: (key: string) => {
        return prefsData[key];
      },
      set: (key: string, value: any) => {
        prefsData[key] = value;
      }
    }
  };
});

const dialog: Dialog = {
  behavior: {
    displayDuration: 1,
    target: "http://example.com",
    timing: Timing.afterNavigation
  },
  content: {
    body: [],
    button: "",
    title: ""
  },
  id: "dialog-1"
};

const tab: Tabs.Tab = {
  index: 0,
  highlighted: true,
  active: true,
  pinned: false,
  incognito: false
};

async function showOnActiveTab(
  dialog: Dialog
): Promise<ShowOnpageDialogResult> {
  return await showOnpageDialog(tab.index, tab, dialog);
}

describe("tab-manager", () => {
  describe("showOnpageDialog", () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it("rejects dialogs that should be dismissed", async () => {
      jest.spyOn(timing, "shouldBeDismissed").mockReturnValue(true);

      expect(await showOnActiveTab(dialog)).toBe(
        ShowOnpageDialogResult.rejected
      );
    });
  });

  it("ignores dialogs that fail to be assigned to the page", async () => {
    jest.spyOn(timing, "shouldBeDismissed").mockReturnValue(false);
    jest.spyOn(timing, "shouldBeShown").mockResolvedValue(true);
    jest.spyOn(dialogModule, "isDialog").mockReturnValue(false);

    expect(await showOnActiveTab(dialog)).toBe(ShowOnpageDialogResult.ignored);
  });
});
