<script lang="ts" setup>
import {models} from "$/node-types";
import { nextTick, ref, watch } from "vue";
import { settings, tree } from "@/components/store";
import { InSocket, Tree } from "$/node/";

const props = defineProps<{
  node: models.CssInputNode,
}>();

const emit = defineEmits<{
  (event: "force-update", requiresShaderReload: boolean, editedSocket: InSocket): void,
}>();

const sampler = ref<HTMLDivElement | null>(null);
watch(() => props.node.ins[0].inValue(), () => {
  setTimeout(() => {
    const computedColorRgb = getComputedStyle(sampler.value!).backgroundColor; // either in rgb or rgba format
    const numbers = computedColorRgb.slice(computedColorRgb.indexOf("(") + 1, computedColorRgb.lastIndexOf(")"))
        .split(",")
        .map(value => Number(value));

    props.node.computedColor = new settings.deviceSpace(numbers.slice(0, 3).map(value => value / 255));
    props.node.computedAlpha = numbers[3] ?? 1;

    emit("force-update", true, props.node.ins[0]);
  }, 0);
});
</script>

<template>
  <div
    class="css-preview"
    :style="{
      '--color': node.ins[0].inValue(),
    }"
  ></div>
  <div 
    :style="{
      '--color': node.ins[0].inValue(),
    }"
    ref="sampler"
  ></div>
</template>

<style lang="scss" scoped>
div {
  --color: #0000;
  background-color: var(--color);
}

.css-preview {
  width: 100%;
  height: 2rem;
  margin: 0 var(--socket-text-padding);
  border-radius: var(--node-widget-border-radius);

  box-shadow: 0 0 0 2px var(--node-border-color);
  
  transition: background 0.1s ease-in-out;
}
</style>