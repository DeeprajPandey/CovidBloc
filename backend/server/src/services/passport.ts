import * as dotenv from 'dotenv';
import fs from 'fs';
import * as path from 'path';
import { Strategy as JwtStrategy, ExtractJwt} from 'passport-jwt';
import HealthOfficialModel from '../models/HealthOfficial';

dotenv.config();

const env_variables = Boolean(
  process.env.JWT_PRIVFILE && process.env.JWT_PUBFILE
);
if (!env_variables) {
  console.error("Required ENV variables not found. Shutting down...");
  process.exit(1);
}

// @ts-ignore
const pkeypath = path.join(process.cwd(), process.env.JWT_PUBFILE);
const PUBKEY = fs.readFileSync(pkeypath, 'utf-8');

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: PUBKEY,
  algorithms: ['RS256']
};

const verifyCallback = async function(jwt_payload: any, done: any) {
  console.log(jwt_payload);
  const official_email = jwt_payload.email;
  
  try {
    // Attempt to read this user from the database
    const dbObj = await HealthOfficialModel.findOne({ email: official_email });
    // Official is not authorised
    if (!dbObj) {
      console.info(`Unauthorised user: ${official_email}`);
      done(null, false, {
        r: "unauthorised"
      });
    }

    // If the user has not registered, we won't find their asset in WS
    if (dbObj.t_status === "UNREGISTERED") {
      done(null, false, {
        r: "unregistered"
      });
    }

    // User has registered
    // TODO: Connect to Fabric and get info
  } catch (err) {
    done(err, false);
  }
}

export = async (passport: any) => {
  passport.use(new JwtStrategy(options, verifyCallback));
};
// export function m() {
//   console.log(PUBKEY);
// }