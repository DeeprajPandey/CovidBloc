<template>
  <div>
    <base-header
      class="header pb-6 pt-5 pt-lg-5 d-flex align-items-center"
      style="min-height: 600px; background-image: url(img/theme/personal_info.svg); background-size: cover; background-position: center top;"
    >
      <!-- Mask -->
      <span class="mask bg-gradient-success opacity-8"></span>
      <!-- Header container -->
      <div class="container-fluid d-flex align-items-center">
        <div class="row">
          <div class="col-lg-7 col-md-10">
            <h1 class="display-2 text-white">Health Official</h1>
            <p class="text-white mt-0 mb-5">
              You will find your personal details here. If you find any
              discrepancies, contact your administrator.
            </p>
            <!-- <a href="#!" class="btn btn-info">Edit profile</a> -->
          </div>
        </div>
      </div>
    </base-header>

    <div class="container-fluid mt--9">
      <div class="row">
        <div class="col-xl-4 order-xl-2 mb-5 mb-xl-0">
          <div class="card card-profile shadow">
            <div class="row justify-content-center">
              <div class="col-lg-3 order-lg-2">
                <div class="card-profile-image">
                  <a href="#">
                    <img src="img/theme/profile_user.png" class="rounded-circle" />
                  </a>
                </div>
              </div>
            </div>
            <div class="card-header text-center border-0 pt-8 pt-md-4 pb-0 pb-md-4">
              <div class="d-flex justify-content-between">
                <base-button size="sm" type="info" class="mr-4 invisible">Connect</base-button>
                <base-button size="sm" type="default" class="float-right invisible">Message</base-button>
              </div>
            </div>
            <div class="card-body pt-0 pt-md-4">
              <div class="row">
                <div class="col">
                  <div class="card-profile-stats d-flex justify-content-center mt-md-5">
                    <div>
                      <span class="heading">{{ usr.approveCtr }}</span>
                      <span class="description">Approvals</span>
                    </div>
                    <div>
                      <span class="heading">{{ usr.medID }}</span>
                      <span class="description">Med ID</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="text-center">
                <h3>{{ usr.name }}</h3>
                <div class="h5 font-weight-300">
                  <i class="ni location_pin mr-2"></i>India
                </div>
                <div class="h5 mt-4">
                  <i class="ni business_briefcase-24 mr-2"></i>
                  {{ usr.email }}
                </div>
                <div>
                  <i class="ni education_hat mr-2"></i>
                  {{ usr.hospital }}
                </div>
                <hr class="my-4" />
                <p>
                  If you need any of your personal details changed, please
                  contact your admin.
                </p>
                <!-- <a href="#">Show more</a> -->
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-8 order-xl-1">
          <card shadow type="secondary">
            <div slot="header" class="bg-white border-0">
              <div class="row align-items-center">
                <div class="col-8">
                  <h3 class="mb-0">File Bug Report</h3>
                </div>
                <div class="col-4 text-right">
                  <base-button
                    href
                    class="btn btn-sm"
                    v-bind:type="btntype"
                    @click="submitReport"
                  >Submit Report</base-button>
                </div>
              </div>
            </div>
            <template>
              <form @submit.prevent>
                <h6 class="heading-small text-muted mb-4">User information</h6>
                <div class="pl-lg-4">
                  <div class="row">
                    <div class="col-lg-6">
                      <base-input
                        alternative
                        label="First name"
                        input-classes="form-control-alternative"
                        v-model="model.firstName"
                        disabled
                      />
                    </div>
                    <div class="col-lg-6">
                      <base-input
                        alternative
                        label="Last name"
                        input-classes="form-control-alternative"
                        v-model="model.lastName"
                        disabled
                      />
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-lg-6">
                      <base-input
                        alternative
                        label="Contact Number"
                        input-classes="form-control-alternative"
                        required
                        v-model="model.contact"
                      />
                    </div>
                    <div class="col-lg-6">
                      <base-input
                        alternative
                        label="Email address"
                        input-classes="form-control-alternative"
                        v-model="model.email"
                        disabled
                      />
                    </div>
                  </div>
                </div>
                <hr class="my-4" />
                <!-- Description -->
                <h6 class="heading-small text-muted mb-4">Description</h6>
                <div class="pl-lg-4">
                  <div class="form-group">
                    <base-input
                      alternative
                      label="Briefly describe what you were trying to do and what happened."
                    >
                      <textarea
                        rows="4"
                        class="form-control form-control-alternative"
                        placeholder="Optionally, if any notification appeared, please mention that and if possible, paste the contents of the console as well."
                        v-model="model.report"
                      ></textarea>
                    </base-input>
                  </div>
                </div>
              </form>
            </template>
          </card>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: "user-profile",
  created() {
    this.$store
      .dispatch("refresh", { i: this.usr.medID, e: this.usr.email })
      .catch((err) => {
        console.log(err);
      });
  },
  mounted() {
    this.model.email = this.usr.email;
    this.model.firstName = this.usr.name.split(" ")[0];
    this.model.lastName = this.usr.name.split(" ")[1];
  },
  data() {
    return {
      usr: this.$store.getters.getUser,
      model: {
        email: "",
        firstName: "",
        lastName: "",
        contact: "",
        report: "",
      },
      btntype: "default",
    };
  },
  methods: {
    submitReport() {
      if (this.model.contact) {
        this.$axios
          .post("http://localhost:6400/trial", this.model, {
            headers: { Authorization: this.$store.getters.authToken },
          })
          .then((response) => {
            this.btntype = "success";
            this.notify(response.data, "primary");
          })
          .catch((err) => {
            if (!err.response.data) {
              this.notify(`⚠️ ${err.message}`, "error");
            } else {
              this.notify(err.response.data, "error");
            }
            console.log(err);
          })
          .finally(() => {
            setTimeout(() => {
              this.btntype = "default";
            }, 2000);
          });
      } else {
        this.notify("Contact number required", "error");
      }
    },
    notify(reason, toastType) {
      this.$toasted.show(reason, {
        type: toastType,
        theme: "toasted-primary",
        position: "top-right",
        duration: 5000,
      });
    },
  },
};
</script>
<style></style>
