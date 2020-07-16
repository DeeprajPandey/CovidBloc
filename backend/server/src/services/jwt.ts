import * as dotenv from 'dotenv';
import fs from 'fs';
import jsonwebtoken from 'jsonwebtoken';

dotenv.config();

const env_variables = Boolean(
  process.env.JWT_PRIVFILE
);
if (!env_variables) {
  console.error("Required ENV variables not found. Shutting down...");
  process.exit(1);
}

// @ts-ignore
const skeypath = path.join(process.cwd(), process.env.JWT_PRIVFILE);
const PRIVKEY = fs.readFileSync(skeypath, 'utf-8');

// pass the medical official read from the database to the function
function newJWT(official: any) {
  const payload = {
    email: official.email,
    iat: Math.floor(Date.now()/1000)
  };

  const jwtoken = jsonwebtoken.sign(payload, PRIVKEY, { expiresIn: '7d', algorithm: 'RS256' });

  return {
    token: `Bearer ${jwtoken}`,
    expires: '7d'
  }
}
