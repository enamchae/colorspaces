<script lang="ts" setup>
import {inject, computed, watch, getCurrentInstance, onMounted, ref} from "vue";

import NodeOutputColorValues from "./NodeOutputColorValues.vue";
import NodeOutputColorDisplay from "./NodeOutputColorDisplay.vue";
import NodeOutputCssRgbVec from "./NodeOutputCssRgbVec.vue";
import NodeOutputCssColor from "./NodeOutputCssColor.vue";
import NodeOutputQuantized from "./NodeOutputQuantized.vue";
import NodeOutputCssInput from "./NodeOutputCssInput.vue";

import {InSocket, Node, NodeUpdateSource, OutputDisplayType} from "$/node/";
import { NodeWithOverloads } from "$/node/Overload";
import {models, output} from "$/node-types";
import {Col} from "$/color-management/";
import { Vec3 } from "$/util";
import { tree } from "@/components/store";

const props = defineProps<{
  node: Node,
}>();

const emit = defineEmits<{
  (event: "force-update", requiresShaderReload: boolean, editedSocket: InSocket): void,
}>();

const hasConstantOutput = ref(true);
const setHasConstantOutput = () => {
  hasConstantOutput.value = props.node.getDependencyAxes().size === 0;
};
onMounted(setHasConstantOutput);
watch(() => tree.links(), setHasConstantOutput)

const type = computed(() => (props.node.constructor as typeof Node).outputDisplayType);

const display = ref(props.node.display({}));

const nDecimals = 4;

watch(() => props.node.getDependencyAxes().size, () => {
  getCurrentInstance()?.proxy?.$forceUpdate();
});


const colorDisplayVue = ref<InstanceType<typeof NodeOutputColorDisplay>>();
const quantizedDisplayVue = ref<InstanceType<typeof NodeOutputQuantized>>();
defineExpose({
  reload: (requiresShaderReload: boolean, updateSource: NodeUpdateSource) => {
    colorDisplayVue.value?.reload(requiresShaderReload, updateSource);
    quantizedDisplayVue.value?.reload();
    display.value = props.node.display({});
  },
});
</script>

<template>
  <div class="node-output">
    <template v-if="type === OutputDisplayType.Color">
      <NodeOutputColorValues
        :values="display.values"
        :labels="display.labels"
        :flags="display.flags"
        v-if="hasConstantOutput"
      />
      <NodeOutputColorDisplay
        :node="node"
        ref="colorDisplayVue"
      />
    </template>

    <template v-else-if="type === OutputDisplayType.Float">
      <div class="output-values"
          v-if="hasConstantOutput">{{display.values[0].toFixed(nDecimals)}}</div>
    </template>

    <template v-else-if="type === OutputDisplayType.Vec">
      <NodeOutputColorValues
        :values="display.values"
        :labels="display.labels"
        :flags="display.flags"
        v-if="hasConstantOutput"
      />
    </template>

    <template v-else-if="type === OutputDisplayType.Css && node instanceof NodeWithOverloads">
      <template v-if="hasConstantOutput">
        <NodeOutputCssRgbVec
          :rgbVec="display.values as Vec3"
          v-if="node.overloadManager.mode === node.overloadManager.dropdown.data.options?.[0].value"
        />
        <NodeOutputCssColor
          :color="display.values as Col"
          v-else
        />
      </template>
    </template>

    <template v-else-if="node instanceof output.ImagePlotNode">
      <NodeOutputColorDisplay
        :node="node"
        :width="Math.max(1, node.widthSocket.inValue({coords: [0, 0]}))"
        :height="Math.max(1, node.heightSocket.inValue({coords: [0, 0]}))"
        :webglViewportWidth="node.normalizeCoordsSocket.inValue() ? 1 : node.widthSocket.inValue()"
        :webglViewportHeight="node.normalizeCoordsSocket.inValue() ? 1 : node.heightSocket.inValue()"
        
        ref="colorDisplayVue"
      />
    </template>

    <template v-else-if="node instanceof output.SampleHexCodesNode">
      <NodeOutputQuantized
        :node="node"
        ref="quantizedDisplayVue"
      />
    </template>

    <template v-else-if="node instanceof models.CssInputNode">
      <NodeOutputCssInput
        :node="node"
        @force-update="(requiresShaderReload: boolean, editedSocket: InSocket) => $emit('force-update', requiresShaderReload, editedSocket)"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
:deep(.output-values) {
  max-width: 100%;
  overflow-x: auto;

  font-family: var(--font-mono);
  font-size: 0.75em;
}
</style>