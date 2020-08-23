<template>
  <div>
    <base-header
      class="header pb-6 pt-5 pt-lg-5 d-flex align-items-center"
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
              After diagnosing a patient, please follow these steps to
              generate
              <br />an approval ID so they can upload their Daily Keys from the
              CovidBloc App.
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
                  <h1 class="mb-0 display-4">Instructions</h1>
                </div>
              </div>
            </div>
            <div>
              <h4>Instruct the patient to:</h4>
              <ol class="list-unstyled">
                <li>
                  Tap on upload keys on the CovidBloc App
                  <i
                    class="fa fa-question-circle"
                    aria-hidden="true"
                  ></i>
                </li>
                <li>
                  Either enter the details received on SMS
                  <i
                    class="fa fa-question-circle"
                    aria-hidden="true"
                  ></i>
                </li>
                <li>
                  Or scan the QR code that will appear below once approval is generated
                  <i
                    class="fa fa-question-circle"
                    aria-hidden="true"
                  ></i>
                </li>
                <li>
                  Tap on I agree. This will share the patient's daily keys from the last 14
                  days
                  <i
                    class="fa fa-question-circle"
                    aria-hidden="true"
                  ></i>
                </li>
              </ol>
            </div>
            <div v-if="approvalStr">
              <br/>
              <p class="text-muted">Scan this code from the CovidBloc app to automatically upload the random IDs</p>
              <img :src="qrURL" alt="QR Code to be scanned on the CovidBloc mobile app" />
            </div>
          </card>
        </div>
        <div class="col-xl-6 order-xl-1">
          <card shadow type="secondary">
            <div slot="header" class="bg-white border-0">
              <div class="row align-items-center">
                <div class="col-8">
                  <h1 class="mb-0 display-4">Generate Code</h1>
                </div>
                <div class="col-4 text-right">
                  <h1 style="letter-spacing: 0.15em;">{{ approvalID }}</h1>
                </div>
              </div>
            </div>
            <form>
              <div class="pl-lg-4">
                <div class="row">
                  <div class="col-lg-12">
                    <div class="mb-3">
                      <p class="text-muted">
                        The contact number is
                        <mark>optional</mark> and we only
                        ask for it to send the patient an SMS with the code for
                        their convenience. You can generate an approval without
                        their number if they do not wish to disclose it.
                      </p>
                    </div>
                    <base-input
                      alternative
                      label="Patient's Contact Number"
                      placeholder="+91XXXXX"
                      input-classes="form-control-alternative"
                      v-model="request.patientContact"
                    />
                    <file-reader v-if="showFileUpload" @load="fileLoad" @err="fileErr"></file-reader>
                  </div>
                </div>
              </div>
              <div class="col-11 text-center">
                <base-button
                  v-bind:disabled="generateBtnDisabled"
                  type="primary"
                  class="my-4"
                  @click="clickGenerate"
                >Generate</base-button>
              </div>
            </form>
          </card>
        </div>
      </div>
    </div>
    <modal
      :show.sync="noNumModal"
      gradient="danger"
      modal-classes="modal-danger modal-dialog-centered"
    >
      <div class="py-3 text-center">
        <i class="ni ni-bell-55 ni-3x"></i>
        <h4 class="heading mt-4">No contact number</h4>
        <p>
          You didn't enter the patient's contact number. That's okay, but they
          won't receive the approval ID and your medical ID via SMS.
          <br />You will see the ID on the dashboard and will have to enter it on
          their phone yourself.
        </p>
      </div>

      <template slot="footer">
        <base-button type="white" @click="modalConfirm">Ok, Got it</base-button>
        <base-button type="link" text-color="white" class="ml-auto" @click="modalReject">Close</base-button>
      </template>
    </modal>
  </div>
</template>
<script>
import FileReader from "../components/FileReader";

export default {
  name: "user-profile",
  components: {
    FileReader,
  },
  // created() {
  //   this.$store
  //     .dispatch("refresh", {i: this.$store.getters.getUser.medID, e: this.$store.getters.getUser.email})
  //     .catch((err) => {
  //       console.log(err);
  //     });
  // },
  data() {
    return {
      request: {
        email: this.$store.getters.getUser.email,
        medID: this.$store.getters.getUser.medID,
        patientContact: "",
      },
      approvalID: "",
      showFileUpload: false,
      generateBtnDisabled: false,
      noNumModal: false,
      approvalStr: "",
      qrURL: "",
    };
  },
  methods: {
    fileLoad(pKey) {
      this.sign(pKey, this.approvalID)
        .then((signature) => {
          this.approvalStr = JSON.stringify({
            apID: this.approvalID,
            medID: this.request.medID,
            sig: signature,
          });
          this.genQRCode();
          
          // send the signature and ID to patient
          this.$axios
            .post(
              "http://localhost:6400/sms",
              {
                apID: this.approvalID,
                medID: this.request.medID,
                contact: this.request.patientContact,
                sig: signature,
              },
              { headers: { Authorization: this.$store.getters.authToken } }
            )
            .then((resp) => {
              if (resp.data.smsErr) {
                this.notify(resp.data.smsErr);
              } else {
                this.notify(
                  "Signature and ID sent to patient. Waiting for daily keys."
                );
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
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          this.generateBtnDisabled = false;
        });
    },
    fileErr(msg) {
      this.notify(msg, "error");
    },
    sign(pKeyPEM, data) {
      return new Promise((resolve) => {
        let sig = new this.$crypto.KJUR.crypto.Signature({
          alg: "SHA512withRSA",
        });
        sig.init(pKeyPEM);
        sig.updateString(data);
        const sigHex = sig.sign();
        resolve(sigHex);
      });
    },
    clickGenerate() {
      // check if patient num is empty, and alert
      if (!this.request.patientContact) {
        this.noNumModal = true;
      } else {
        this.genApproval();
      }
    },
    modalConfirm() {
      this.genApproval();
      this.noNumModal = false;
    },
    modalReject() {
      this.noNumModal = false;
    },
    genApproval() {
      // Disable generate button until signature has been sent
      this.generateBtnDisabled = true;
      this.$axios
        .post("http://localhost:6400/generateapproval", this.request, {
          headers: { Authorization: this.$store.getters.authToken },
        })
        .then((response) => {
          this.approvalID = response.data.apID;

          // Show input field and ask for private key
          this.showFileUpload = true;
          this.notify("Please provide your private key");
        })
        .catch((err) => {
          this.generateBtnDisabled = false;
          if (!err.response.data) {
            this.notify(`⚠️ ${err.message}`);
          } else {
            this.notify(err.response.data);
          }
          console.log(err);
        });
    },
    genQRCode() {
      console.log(this.approvalStr);

      this.$qrcode.toDataURL(this.approvalStr, (err, url) => {
        if (err) {
          console.error(err);
        } else {
          console.log(url);
          this.qrURL = url;
        }
      });
    },
    notify(reason) {
      this.$toasted.show(reason, {
        theme: "toasted-primary",
        position: "top-right",
        duration: 6000,
      });
    },
  },
};
</script>
<style></style>
