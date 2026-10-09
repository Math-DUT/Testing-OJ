import { checkOutput } from "./checkers";
self.onmessage = ({ data }) => {
  self.postMessage(checkOutput(data.checker, data.input, data.output, data.expected));
};
