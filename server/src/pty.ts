import * as pty from "node-pty"; 
import path from "path";
import os from "os";

const shell = os.platform() === "darwin" ? "zsh" : "bash";

export class TerminalManager {
  private sessions: { [id: string]: { terminal: pty.IPty; replId: string } } = {};

  constructor() {
    this.sessions = {};
  }

  createPty(id: string, replId: string, onData: (data: string, id: number) => void): pty.IPty {
    const term = pty.spawn(shell, [], {
      cols: 100,
      name: "xterm",
      cwd: path.join(__dirname, `../shivam/${replId}`),
    });

    term.onData((data: string) => onData(data, term.pid));

    this.sessions[id] = {
      terminal: term,
      replId: replId,
    };

    term.onExit(() => {
      delete this.sessions[id];
    });

    return term;
  }

  write(terminalId: string, data: string): void {
    this.sessions[terminalId]?.terminal.write(data);
  }

  clear(terminalId: string): void {
    if (this.sessions[terminalId]) {
      this.sessions[terminalId].terminal.kill();
      delete this.sessions[terminalId];
    }
  }
}