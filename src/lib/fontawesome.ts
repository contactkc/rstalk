import { library } from '@fortawesome/fontawesome-svg-core';
import { config } from '@fortawesome/fontawesome-svg-core';

import { 
  faSearch,
  faUser,
  faHashtag,
  faSpinner,
  faCog,
  faHome,
  faEye,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons';

import {
  faGithub,
  faTwitter,
  faDiscord
} from '@fortawesome/free-brands-svg-icons';

config.autoAddCss = false;

library.add(
  faSearch,
  faUser,
  faHashtag,
  faSpinner,
  faCog,
  faHome,
  faEye,
  faEyeSlash,
  faGithub,
  faTwitter,
  faDiscord
);
