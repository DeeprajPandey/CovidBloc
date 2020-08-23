<template>
  <div class="row justify-content-center">
    <div class="col-lg-5 col-md-7">
      <div class="card bg-secondary shadow border-0">
        <div class="card-body px-lg-5 py-lg-5">
          <div class="text-center text-muted mb-4">
            <small>Use your assigned email ID to register on the blockchain</small>
          </div>
          <form role="form">
            <!-- <base-input class="input-group-alternative mb-3"
              placeholder="Name"
              addon-left-icon="ni ni-hat-3"
              v-model="model.name">
            </base-input>-->

            <base-input
              required
              class="input-group-alternative mb-3"
              placeholder="Email"
              addon-left-icon="ni ni-email-83"
              v-model="credentials.email"
            ></base-input>

            <div class="row my-4">
              <div class="col-12">
                <base-checkbox class="custom-control-alternative">
                  <span class="text-muted">
                    I agree with the
                    <a href="#!">Privacy Policy</a>
                  </span>
                </base-checkbox>
              </div>
            </div>
            <div class="text-center">
              <base-button type="primary" class="my-4" @click="checkUser">Create account</base-button>
            </div>
          </form>
          <div class="col-10 text-right">
            <router-link to="/login" class="text-blue">
              <small>Already have an account? Sign in</small>
            </router-link>
          </div>
        </div>
      </div>
      <!--
      <div class="row mt-3">
        <div class="col-6">
          <a href="#" class="text-light">
              <small>Forgot password?</small>
          </a>
        </div>
        <div class="col-6 text-right">
          <router-link to="/login" class="text-light">
            <small>Login into your account</small>
          </router-link>
        </div>
      </div>
      -->
    </div>
  </div>
</template>
<script>
export default {
  name: "register",
  created() {
    // Check if the browser supports saving files
    try {
      var isFileSaverSupported = !!new Blob();
      if (!isFileSaverSupported) {
        console.error("Saving files is not supported!");
      }
    } catch (e) {
      console.error(e);
    }
  },
  data() {
    return {
      credentials: {
        email: "",
      },
      ok: true,
    };
  },
  methods: {
    checkUser() {
      if (this.credentials.email) {
        // check if this user can register
        this.$axios
          .post(
            "http://localhost:6400/check-registration-status",
            this.credentials
          )
          .then((response) => {
            if (response.data === "valid") {
              // generate keypair
              this.keyGen().then((keys) => {
                // send the public key with registration request
                this.registerUser(keys.pubKeyPEM);
                // download the private key on client's device
                this.downloadFile(keys.privKeyPEM);
              });
            }
          })
          .catch((err) => {
            if (!err.response.data) {
              this.notify(`⚠️ ${err.message}`);
            } else {
              this.notify(err.response.data);
            }
            console.log(err);
          });
      } else {
        this.notify("Please enter your email");
      }
    },
    keyGen() {
      return new Promise((resolve) => {
        console.log("Generating keys");
        const {
          prvKeyObj: privKey,
          pubKeyObj: pubKey,
        } = this.$crypto.KEYUTIL.generateKeypair("RSA", 2048);
        console.log("PEM encoding");
        const privKeyPEM = this.$crypto.KEYUTIL.getPEM(privKey, "PKCS8PRV");
        const pubKeyPEM = this.$crypto.KEYUTIL.getPEM(pubKey);
        resolve({ privKeyPEM, pubKeyPEM });
      });
    },
    downloadFile(data) {
      var blob = new Blob([data], {
        type: "text/plain;charset=utf-8",
      });
      this.$saveAs(blob, "covidbloc_privkey_RSA2048.pem");
    },
    registerUser(pubKeyPEM) {
      this.$axios
        .post("http://localhost:6400/register", {
          email: this.credentials.email,
          publicKey: pubKeyPEM
        })
        .then((response) => {
          this.notify(response.data);
        })
        .catch((err) => {
          if (!err.response.data) {
            this.notify(`⚠️ ${err.message}`);
          } else {
            this.notify(err.response.data);
          }
          console.log(err);
        });
    },
    notify(reason) {
      let msg = "";
      let toastType = "";
      let where = "";
      switch (reason) {
        case "success":
          msg =
            "Registered successfully. Please log in with the credentials you received on your email.";
          toastType = "success";
          where = "/login";
          break;
        case "registered":
          msg = "You have already registered. Please log in.";
          where = "/login";
          break;
        case "unauthorised":
          msg = "⚠️ Incorrect credentials.";
          break;
        default:
          msg = reason;
          break;
      }
      this.$toasted.show(msg, {
        type: toastType,
        theme: "toasted-primary",
        position: "top-right",
        duration: 5000,
      });
      if (where) {
        this.$router.push(where);
      }
    },
  },
};
</script>
<style></style>
