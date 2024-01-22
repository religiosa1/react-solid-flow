import { afterEach, expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";

// see: https://github.com/nknapp/vitest-react-18-testing-library-missing-act-workaround/blob/master/src/setupVitest.js
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => cleanup());
expect.extend(matchers);