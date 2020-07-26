<template>
  <div class="row justify-content-center">
    <div class="col-lg-5 col-md-7">
      <div class="card bg-secondary shadow border-0">
        <!--
        <div class="card-header bg-transparent pb-5">
          <div class="text-muted text-center mt-2 mb-3"><small>Sign in with</small></div>
          <div class="btn-wrapper text-center">
            <a href="#" class="btn btn-neutral btn-icon">
              <span class="btn-inner--icon"><img src="img/icons/common/github.svg"></span>
              <span class="btn-inner--text">Github</span>
            </a>
            <a href="#" class="btn btn-neutral btn-icon">
              <span class="btn-inner--icon"><img src="img/icons/common/google.svg"></span>
              <span class="btn-inner--text">Google</span>
            </a>
          </div>
        </div>
        -->
        <div class="card-body px-lg-5 py-lg-5">
          <div class="text-center text-muted mb-4">
            <small>Sign in with credentials</small>
          </div>
          <form role="form">
            <base-input
              class="input-group-alternative mb-3"
              placeholder="Med ID"
              addon-left-icon="ni ni-key-25"
              v-if="!hasRequestedOTP"
              v-model="otpcredentials.medID"
            >
            </base-input>
            <base-input
              class="input-group-alternative mb-3"
              placeholder="Email"
              addon-left-icon="ni ni-email-83"
              v-model="credentials.email"
            >
            </base-input>

            <base-input
              class="input-group-alternative"
              placeholder="OTP"
              type="password"
              addon-left-icon="ni ni-lock-circle-open"
              v-if="hasRequestedOTP"
              v-model="credentials.otp"
            >
            </base-input>
            <!--
            <base-checkbox class="custom-control-alternative">
              <span class="text-muted">Remember me</span>
            </base-checkbox> -->
            <div class="text-center">
              <base-button
                type="primary"
                class="my-4"
                @click="requestOTP"
                v-if="!hasRequestedOTP"
                >Request OTP</base-button
              ><br />
              <base-button
                type="primary"
                class="my-4"
                @click="callServer"
                v-if="hasRequestedOTP"
                >Sign in</base-button
              >
            </div>
          </form>
          <div class="col-9 text-right">
            <router-link to="/register" class="text-blue"
              ><small>Dont have an account? Sign up</small></router-link
            >
          </div>
        </div>
      </div>
      <!--
      <div class="row mt-3">
        <div class="col-6">
          <a href="#" class="text-light"><small>Forgot password?</small></a>
        </div> 
      </div> -->
    </div>
  </div>
</template>
<script>
export default {
  name: "login",
  data() {
    return {
      credentials: {
        email: "",
        otp: "",
      },
      otpcredentials: {
        medID: "",
      },
      hasRequestedOTP: false,
      meta: "none",
    };
  },
  methods: {
    callServer() {
      this.$store
        .dispatch("login", this.credentials)
        .then(() => {
            this.$router.push("/profile");
        })
        .catch((err) => {
          if (!err.response.data) {
            this.notify(`⚠️ ${err.message}`);
          } else {
            this.notify(err.response.data);
          }
          console.log(err);
        })
        .finally(() => {
          this.hasRequestedOTP = false;
        });
    },
    requestOTP() {
      this.$axios
        .post("http://localhost:6400/requestotp", {
          email: this.credentials.email,
          medID: this.otpcredentials.medID,
        })
        .then((response) => {
          this.hasRequestedOTP = true;
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
        case "otpinit":
          msg = "Please log in with the code you received in your email.";
          this.hasRequestedOTP = true;
          break;
        case "nootp":
          this.hasRequestedOTP = false;
          msg = "Please enter your credentials to receive a login OTP.";
          break;
        case "timeout":
          msg =
            "Your code expired so we emailed you a new one. Please log in again.";
          this.hasRequestedOTP = true;
          break;
        case "incorrect":
          msg = "⚠️ Incorrect OTP. Please enter the correct code.";
          this.hasRequestedOTP = true;
          break;
        case "unauthorised":
          this.hasRequestedOTP = false;
          msg = "⚠️ Incorrect credentials.";
          break;
        case "unregistered":
          this.hasRequestedOTP = false;
          msg = "Please register first.";
          where = "/register";
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
        this.$router.go(where);
      }
    },
  },
};
</script>
<style></style>
