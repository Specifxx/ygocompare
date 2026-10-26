import type { Post } from "./types";
import { post as gd06 } from "./gd06";
import { post as expensive } from "./most-expensive";
import { post as banList } from "./ban-list";
import { post as rarities } from "./rarities";
import { post as whereToBuy } from "./where-to-buy";
import { post as boxOrSingles } from "./box-or-singles";

export const POSTS: Post[] = [gd06, expensive, banList, rarities, whereToBuy, boxOrSingles];
