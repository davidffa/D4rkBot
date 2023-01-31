import { Member, User } from 'oceanic.js';

export function dynamicAvatar(user: User | Member) {
  if (user.avatar?.startsWith('a_')) {
    return user.avatarURL('gif');
  }

  return user.avatarURL('png');
}