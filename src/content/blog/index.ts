import type { Post } from "./types";
import { post as schedule } from "./release-schedule";
import { post as expensive } from "./most-expensive";
import { post as rarities } from "./rarities";
import { post as editions } from "./editions";
import { post as cardValue } from "./card-value";
import { post as whereToBuy } from "./where-to-buy";
import { post as giftGuide } from "./gift-guide";
import { post as attributes } from "./attributes";
import { SET_POSTS } from "./set-chase";

export const POSTS: Post[] = [giftGuide, attributes, schedule, expensive, rarities, editions, cardValue, whereToBuy, ...SET_POSTS];
