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
import { port } from "../../api/background";
import {
  addMessageListeners,
  handleGetStateMessage,
  handleSetStateMessage,
  isStateMessage
} from "./messaging-adapter";
import { MessageName } from "../shared";

describe("state:messagingAdapter", () => {
  describe("addMessageListeners", () => {
    it("should add listeners for get and set messages", () => {
      jest.spyOn(port, "on");
      addMessageListeners({});

      expect(port.on).toHaveBeenCalledWith(
        MessageName.read,
        expect.any(Function)
      );
      expect(port.on).toHaveBeenCalledWith(
        MessageName.modify,
        expect.any(Function)
      );
    });
  });

  describe("handleGetStateMessage", () => {
    // the message type
    const type = MessageName.read;

    it("should return the correct value when given a valid message and key", () => {
      const value = "__value__";
      const store = {
        foo: new BehaviorSubject(value)
      };
      const message = {
        type,
        key: "foo"
      };

      const result = handleGetStateMessage(message, store);
      expect(result).toBe(value);
    });

    it("should return `undefined` when given an nonexisting key", () => {
      const value = "__value__";
      const store = {
        foo: new BehaviorSubject(value)
      };
      const message = {
        type,
        key: "__no_such_key__"
      };

      const result = handleGetStateMessage(message, store);
      expect(result).toBeUndefined();
    });

    it("should return `undefined` when given an invalid message", () => {
      const value = "__value__";
      const store = {
        foo: new BehaviorSubject(value)
      };
      const message = {
        type,
        invalid: "property"
      };

      const result = handleGetStateMessage(message, store);
      expect(result).toBeUndefined();
    });
  });

  describe("handleSetStateMessage", () => {
    // the message type
    const type = MessageName.modify;

    it("should update the value if the message is valid and the key exists ", () => {
      const newValue = "__new_value__";
      const store = {
        foo: new BehaviorSubject("__value__")
      };
      const message = {
        type,
        key: "foo",
        value: newValue
      };

      handleSetStateMessage(message, store);
      expect(store.foo.value).toBe(newValue);
    });

    it("should not update the value if the message is missing the `value` property", () => {
      const oldValue = "__old_value__";
      const store = {
        foo: new BehaviorSubject(oldValue)
      };
      const message = {
        type,
        key: "foo"
      };

      handleSetStateMessage(message, store);
      expect(store.foo.value).toBe(oldValue);
    });

    it("should return the proper boolean value depending on whether the update was successful", () => {
      const store = {
        foo: new BehaviorSubject("__old_value__")
      };
      const message1 = {
        type,
        key: "foo"
      };
      const message2 = {
        type,
        key: "foo",
        value: "__value__"
      };
      const message3 = {
        type,
        key: "__no_such_key__",
        value: "__value__"
      };

      expect(handleSetStateMessage(message1, store)).toBeFalse();
      expect(handleSetStateMessage(message2, store)).toBeTrue();
      expect(handleSetStateMessage(message3, store)).toBeFalse();
    });
  });

  describe("isStateMessage", () => {
    it("should return `true` for valid messages", () => {
      const message1 = {
        type: MessageName.modify,
        key: "__some_key__"
      };
      const message2 = {
        type: MessageName.modify,
        key: "__some_key__",
        value: "__value__"
      };
      const message3 = {
        type: MessageName.modify,
        key: "__some_key__",
        value: "__value__",
        some: "additional_prop"
      };

      expect(isStateMessage(message1)).toBeTrue();
      expect(isStateMessage(message2)).toBeTrue();
      expect(isStateMessage(message3)).toBeTrue();
    });
    it("should return `false` for invalid messages", () => {
      const message1 = {
        type: MessageName.modify
      };
      const message2 = {
        type: MessageName.modify,
        key: 12345,
        value: "__value__"
      };

      expect(isStateMessage(message1)).toBeFalse();
      expect(isStateMessage(message2)).toBeFalse();
    });
  });
});
