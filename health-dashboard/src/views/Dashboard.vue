<template>
  <div>
    <base-header
      class="header pb-8 pt-5 pt-lg-8 d-flex align-items-center"
      style="min-height: 600px; background-image: url(img/theme/profile-cover.jpg); background-size: cover; background-position: center top;"
    >
      <!-- Mask -->
      <span class="mask bg-gradient-success opacity-8"></span>
      <!-- Header container -->
      <div class="container-fluid d-flex align-items-center">
        <div class="row">
          <div class="col-lg-12 col-md-10">
            <h1 class="display-2 text-white">Generate Approval Code</h1>
            <p class="text-white mt-0 mb-5">
              After a patient has been diagnosed with COVID-19, follow these
              steps<br />
              to generate an approval record so they can upload their Daily Keys
              from the CToF App.
            </p>
          </div>
        </div>
      </div>
    </base-header>

    <div class="container-fluid mt--7">
      <div class="row">
        <div class="col-xl-6 order-xl-2 mb-5 mb-xl-0">
          <card shadow type="secondary">
            <div slot="header" class="bg-white border-0">
              <div class="row align-items-center">
                <div class="col-8">
                  <h3 class="mb-0">Instructions</h3>
                </div>
              </div>
            </div>
            <div>
              <h4>Instruct the patient to:</h4>
              <ol style="font-size:14px">
                <li>
                  Open the app by tapping on the icon
                  <i class="fa fa-question-circle" aria-hidden="true"></i>
                </li>
                <li>
                  Tap the upload keys button
                  <i class="fa fa-question-circle" aria-hidden="true"></i>
                </li>
                <li>
                  Enter the approval id and the medical id received via sms
                  <i class="fa fa-question-circle" aria-hidden="true"></i>
                </li>
                <li>
                  Tap the submit button
                  <i class="fa fa-question-circle" aria-hidden="true"></i>
                </li>
                <li>
                  Tap the I agree button. This will share the patient's last 14
                  days temporary keys
                  <i class="fa fa-question-circle" aria-hidden="true"></i>
                </li>
              </ol>
            </div>
          </card>
        </div>
        <div class="col-xl-6 order-xl-1">
          <card shadow type="secondary">
            <div slot="header" class="bg-white border-0">
              <div class="row align-items-center">
                <div class="col-8">
                  <h3 class="mb-0">Generate Code</h3>
                </div>
              </div>
            </div>
            <form>
              <div class="pl-lg-4">
                <div class="row">
                  <div class="col-lg-12">
                    <base-input
                      alternative=""
                      label="Contact Number"
                      placeholder="Patient Phone Number"
                      input-classes="form-control-alternative"
                      v-model="request.patientContact"
                    />
                  </div>
                </div>
              </div>
              <div class="col-11 text-center">
                <base-button type="primary" class="my-4" @click="genApproval"
                  >Generate</base-button
                >
              </div>
            </form>
          </card>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: "user-profile",
  data() {
    return {
      request: {
        email: this.$store.getters.getUser.email,
        medID: this.$store.getters.getUser.medID,
        patientContact: "",
      },
    };
  },
  methods: {
    genApproval() {
      this.$axios
        .post("http://localhost:6400/generateapproval", this.request, {
          headers: { Authorization: this.$store.getters.authToken },
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
      this.$toasted.show(reason, {
        theme: "toasted-primary",
        position: "top-right",
        duration: 5000,
      });
    },
  },
};
</script>
<style></style>
