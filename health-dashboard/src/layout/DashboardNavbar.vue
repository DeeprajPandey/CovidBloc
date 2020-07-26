<template>
    <base-nav class="navbar-top navbar-dark"
              id="navbar-main"
              :show-toggle-button="false"
              expand>
        <form class="navbar-search navbar-search-dark form-inline mr-3 d-none d-md-flex ml-lg-auto">
            <div class="form-group mb-0">
                <!-- <base-input placeholder="Search"
                            class="input-group-alternative"
                            alternative=""
                            addon-right-icon="fas fa-search">
                </base-input> -->
            </div>
        </form>
        <ul class="navbar-nav align-items-center d-none d-md-flex">
          <li class="nav-item">
            <!-- <base-dropdown class="nav-link pr-0"> -->
              <div class="media align-items-center" slot="title">
                <!-- <span class="avatar avatar-sm rounded-circle">
                  <img alt="Image placeholder" src="img/theme/profile_user.png">
                </span> -->
                <a class="nav-link" href="/" @click="logout">
                  <div class="media-body ml-2 d-none d-lg-block">
                    <span class="mb-0 text-sm  font-weight-bold" v-if="isLoggedIn">
                    Logout
                    </span>
                  </div>
                </a>
              </div>

              <!-- <template>
                <div class=" dropdown-header noti-title">
                  <h6 class="text-overflow m-0">Welcome!</h6>
                </div>
                <router-link to="/profile" class="dropdown-item">
                  <i class="ni ni-single-02"></i>
                  <span>My profile</span>
                </router-link>
                <router-link to="/profile" class="dropdown-item">
                  <i class="ni ni-support-16"></i>
                  <span>FAQ</span>
                </router-link>
                <div class="dropdown-divider"></div>
              </template> -->
            <!-- </base-dropdown> -->
          </li>
        </ul>
    </base-nav>
</template>
<script>
  export default {
    computed: {
      isLoggedIn : function(){ return this.$store.getters.isLoggedIn}
    },
    data() {
      return {
        activeNotifications: false,
        showMenu: false,
        searchQuery: '',
        usr: this.$store.getters.getUser
        // isLoggedIn: this.$store.getters.isLoggedIn
      };
    },
    methods: {
      logout() {
        this.$store.dispatch('logout')
        .then(() => this.$router.push('/login'))
        .catch((e) => {
          console.error(e)
        })
      },
      toggleSidebar() {
        this.$sidebar.displaySidebar(!this.$sidebar.showSidebar);
      },
      hideSidebar() {
        this.$sidebar.displaySidebar(false);
      },
      toggleMenu() {
        this.showMenu = !this.showMenu;
      }
    }
  };
</script>
