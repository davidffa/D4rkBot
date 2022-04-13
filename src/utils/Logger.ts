export default class Logger {
  static readonly COLORS = {
    RESET: '\u001b[0m',
    GREEN: '\u001b[32m',
    BLUE: '\u001b[34m',
    YELLOW: '\u001b[33m',
    RED: '\u001b[31m',
    BOLD: '\u001b[1m'
  };

  static getLogger(className: string): Logger {
    return new Logger(className);
  }

  constructor(private readonly className: string) { }

  get currentDate() {
    const date = new Date();
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  }

  info(message: string) {
    console.log(`${this.currentDate} ${Logger.COLORS.BOLD}${Logger.COLORS.GREEN}${this.className} ${Logger.COLORS.BLUE}INFO ${Logger.COLORS.RESET}${message}`);
  }

  warn(message: string) {
    console.warn(`${this.currentDate} ${Logger.COLORS.BOLD}${Logger.COLORS.GREEN}${this.className} ${Logger.COLORS.YELLOW}WARN ${Logger.COLORS.RESET}${message}`);
  }

  error(message: string) {
    console.error(`${this.currentDate} ${Logger.COLORS.BOLD}${Logger.COLORS.GREEN}${this.className} ${Logger.COLORS.RED}ERROR ${Logger.COLORS.RESET}${message}`);
  }
}