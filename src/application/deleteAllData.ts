import { copilot } from '@modules/copilot';
import { forgetSentData } from '@shared/platform/firebase';

export async function deleteAllData(): Promise<void> {
  await forgetSentData();
  copilot.clearAllData();
}
