import xterm from "https://esm.run/xterm";
import FitAddon from "https://esm.run/xterm-addon-fit";

const printOnTerm = {
  getErrorMessage: (err) => [
    "",
    "",
    "Sparrow could not start",
    "",
    "Sparrow internal error message is:",
    err,
    "",
    "",
    "Sparrow is expected to work with recent desktop versions of Chrome, Edge, Firefox and Safari",
    "",
    "",
    "Give it a try from a desktop version / another browser!",
  ],
  printMessage: (text) => {
    for (let i = 0; i < text.length; i++) {
      term.write(text[i]);
      term.write("\n");
    }
  },
  printError: (message) => {
    this.printMessage(message);

    term.write("\n\n");
  },
};

const consoleDiv = document.getElementById("console");

const term = new xterm.Terminal({
  cursorBlink: true,
  convertEol: true,
  fontFamily: '"Source Code Pro", monospace',
  fontWeight: 400,
  fontWeightBold: 700,
});
const fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);
term.open(consoleDiv);
term.scrollToTop();

fitAddon.fit();
window.addEventListener("resize", () => fitAddon.fit(), false);
term.focus();
let cxReadFunc = null;
const writeData = (buf) => term.write(new Uint8Array(buf));
const readData = (str) => {
  if (cxReadFunc == null) return;
  for (let i = 0; i < str.length; i++) cxReadFunc(str.charCodeAt(i));
};
term.onData(readData);

const runBash = () => {
  const structure = {
    name: "bash",
    cmd: "/bin/bash",
    args: ["--login"],
    env: [
      "HOME=/home/user",
      "TERM=xterm",
      "USER=user",
      "SHELL=/bin/bash",
      "EDITOR=vim",
      "LANG=en_US.UTF-8",
      "LC_ALL=C",
    ],
    expectedPrompt: ">",
    versionOpt: "--version",
    comment_line: "#",
    description_line: "The original Bourne Again SHell",
  };
  if (typeof SharedArrayBuffer === "undefined") {
    printOnTerm.printError(printOnTerm.getSharedArrayBufferMissingMessage());
    return;
  }

  const runTest = async (cx) => {
    term.scrollToBottom();

    const cxLogAndRun = async (cheerpx, cmd, args, env) => {
      await cheerpx.run(cmd, args, env);
      printOnTerm.printMessage(" ");
    };

    cxReadFunc = cx.setCustomConsole(writeData, term.cols, term.rows);

    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    consoleDiv.addEventListener("dragover", preventDefaults, false);
    consoleDiv.addEventListener("dragenter", preventDefaults, false);
    consoleDiv.addEventListener("dragleave", preventDefaults, false);
    consoleDiv.addEventListener("drop", preventDefaults, false);

    const opts = { env: structure.env, cwd: "/home/user" };
    while (true) await cxLogAndRun(cx, structure.cmd, structure.args, opts);
  };
  const failCallback = (err) =>
    printOnTerm.printError(printOnTerm.getErrorMessage(err));

  CheerpXApp.create({
    devices: [
      {
        type: "block",
        url: "https://disks.leaningtech.com/webvm_20221004.ext2",
        name: "block1",
      },
    ],
    mounts: [
      { type: "ext2", dev: "block1", path: "/" },
      { type: "cheerpOS", dev: "/app", path: "/app" },
      { type: "cheerpOS", dev: "/str", path: "/data" },
      { type: "devs", dev: "", path: "/dev" },
    ],
    networkInterface: { ready: false },
  }).then(runTest, failCallback);
};

runBash();
