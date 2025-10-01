import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

export async function promptOtp(prompt: string): Promise<string> {
  const rl = createInterface({ input, output });
  try {
    while (true) {
      const raw = (await rl.question(prompt)).trim();
      if (/^\d{6}$/.test(raw)) {
        return raw;
      }
      output.write('無効な入力です。6桁の数字を入力してください。\n');
    }
  } finally {
    rl.close();
  }
}

