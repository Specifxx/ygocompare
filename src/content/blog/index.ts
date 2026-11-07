import type { Post } from "./types";
import { post as fakeCards } from "./fake-cards";
import { post as schedule } from "./release-schedule";
import { post as rarities } from "./rarities";
import { post as editions } from "./editions";
import { post as cardValue } from "./card-value";
import { post as whereToBuy } from "./where-to-buy";
import { post as giftGuide } from "./gift-guide";
import { post as blackFriday } from "./black-friday";

// Sealed only (2026-11-06): the posts that were card price tables are retired and 301 (next.config.js).
export const POSTS: Post[] = [blackFriday, fakeCards, giftGuide, schedule, rarities, editions, cardValue, whereToBuy];
