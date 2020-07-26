<template>
  <footer class="footer px-4">
    <div class="row align-items-center justify-content-lg-between">
      <div class="col-lg-6">
        <div class="copyright text-center text-lg-left text-muted">
          &copy; {{ year }}
          <a
            href="https://github.com/DeeprajPandey/fabric-contact-tracing"
            class="font-weight-bold ml-1"
            target="_blank"
            >Exposure Notification Replica on Fabric</a
          >
        </div>
      </div>
      <div class="col-lg-6">
        <ul
          class="nav nav-footer justify-content-center justify-content-lg-end"
        >
          <li class="nav-item">
            <a
              href="https://github.com/DeeprajPandey/fabric-contact-tracing"
              class="nav-link"
              target="_blank"
              >GitHub Project</a
            >
          </li>
          <li class="nav-item">
            <a
              href="https://deeprajpandey.github.io/fabric-contact-tracing/"
              class="nav-link"
              target="_blank"
              >Documentation</a
            >
          </li>
          <li class="nav-item">
            <a
              href="https://github.com/DeeprajPandey/fabric-contact-tracing"
              class="nav-link"
              target="_blank"
              >License</a
            >
          </li>
          <li class="nav-item">
            <a
              href="https://github.com/DeeprajPandey/fabric-contact-tracing"
              class="nav-link"
              target="_blank"
              >Credits</a
            >
          </li>
        </ul>
      </div>
    </div>
  </footer>
</template>
<script>
export default {
  data() {
    return {
      year: new Date().getFullYear(),
    };
  },
};
</script>
<style></style>
