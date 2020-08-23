<template>
  <label class="text-reader">
    <input type="file" @change="loadTextFromFile" />
  </label>
</template>

<script>
export default {
  methods: {
    loadTextFromFile(evt) {
      const file = evt.target.files[0];
      
      if (!file || file.type !== "application/x-x509-ca-cert") {
        console.log(`[${file.type}] is not a PEM File`);
        console.log(file);
        this.$emit("err", `${file.name} is not a valid private key.`);
        return;
      }

      const reader = new FileReader();

      reader.readAsText(file, "UTF-8");
      reader.onload = (e) => this.$emit("load", e.target.result);
      reader.onerror = (e) => {
        console.error(e);
      };
    },
  },
};
</script>