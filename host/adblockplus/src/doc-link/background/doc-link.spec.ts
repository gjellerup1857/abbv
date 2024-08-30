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

import { BehaviorSubject } from "rxjs";
import { port } from "../../core/messaging/background";
import { info } from "../../info/background";
import { store } from "../../store/background";
import {
  getBrowserName,
  getDocLink,
  handleDocLinkMessage,
  isDocLinkMessage,
  start
} from "./doc-link";

describe("docLink", () => {
  const mockSubject = new BehaviorSubject("__doc-link-template__");

  beforeEach(() => {
    jest.replaceProperty(store, "documentationLink", mockSubject);
  });

  describe("start", () => {
    it("should add a listener for doc-link messages", () => {
      jest.spyOn(port, "on");
      start();

      expect(port.on).toHaveBeenCalledWith(
        "prefs.getDocLink",
        expect.any(Function)
      );
    });
  });

  describe("handleDocLinkMessage", () => {
    // the message type
    const type = "prefs.getDocLink";

    it("should return the correct link when given a valid message", () => {
      const template = "%LINK%%LANG%";
      const link = "__link_id__";
      const lang = "__lang__";
      const message = { type, link };
      mockSubject.next(template);
      jest.spyOn(browser.i18n, "getUILanguage").mockReturnValue(lang);

      const result = handleDocLinkMessage(message);

      expect(result).toBe(link + lang);
    });

    it("should replace the `{browser}` tag in the link", () => {
      const template = "%LINK%";
      const link = "{browser}";
      const message = { type, link };
      mockSubject.next(template);

      const result = handleDocLinkMessage(message);

      expect(result).not.toContain("{browser}");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return the empty string when given an invalid message", () => {
      const message = {
        type,
        invalid: "message"
      };

      const result = handleDocLinkMessage(message);
      expect(result).toBe("");
    });
  });

  describe("getDocLink", () => {
    it("should use the correct template string", () => {
      const template = "__tpl__";
      const linkId = "__link_id__";
      mockSubject.next(template);
      const result = getDocLink(linkId);

      expect(result).toBe(template);
    });

    it("should replace the template tags", () => {
      const template = "%LINK%%LANG%";
      const linkId = "__link_id__";
      const lang = "__lang__";
      mockSubject.next(template);
      jest.spyOn(browser.i18n, "getUILanguage").mockReturnValue(lang);
      const result = getDocLink(linkId);

      expect(result).toBe(linkId + lang);
    });

    it("should replace multiple template tags", () => {
      const template = "%LINK%%LANG%%LANG%%LINK%";
      const linkId = "__link_id__";
      const lang = "__lang__";
      mockSubject.next(template);
      jest.spyOn(browser.i18n, "getUILanguage").mockReturnValue(lang);
      const result = getDocLink(linkId);

      expect(result).toBe(linkId + lang + lang + linkId);
    });
  });

  describe("isDocLinkMessage", () => {
    it("should return `true` for valid messages", () => {
      const message1 = {
        type: "__type__",
        link: "__link__"
      };
      const message2 = {
        type: "__type__",
        link: "__link__",
        some: "additional_prop"
      };

      expect(isDocLinkMessage(message1)).toBeTrue();
      expect(isDocLinkMessage(message2)).toBeTrue();
    });
    it("should return `false` for invalid messages", () => {
      const message1 = {
        type: "__type__"
      };
      const message2 = {
        type: "__type__",
        link: 123
      };

      expect(isDocLinkMessage(message1)).toBeFalse();
      expect(isDocLinkMessage(message2)).toBeFalse();
    });
  });

  describe("getBrowserName", () => {
    it("should pass through the application property on Firefox", () => {
      jest.replaceProperty(info, "platform", "gecko");
      jest.replaceProperty(info, "application", "firefox");
      const result = getBrowserName();
      expect(result).toBe("firefox");
    });

    it("should pass through the application property on Opera", () => {
      jest.replaceProperty(info, "platform", "chromium");
      jest.replaceProperty(info, "application", "opera");
      const result = getBrowserName();
      expect(result).toBe("opera");
    });

    it("should pass through the application property on Edge", () => {
      jest.replaceProperty(info, "platform", "chromium");
      jest.replaceProperty(info, "application", "edge");
      const result = getBrowserName();
      expect(result).toBe("edge");
    });

    it("should return `chrome` for all other applications on chromium platform", () => {
      jest.replaceProperty(info, "platform", "chromium");
      jest.replaceProperty(info, "application", "chrome");
      expect(getBrowserName()).toBe("chrome");

      jest.replaceProperty(info, "application", "foo");
      expect(getBrowserName()).toBe("chrome");
    });
  });
});
