<script lang="ts" setup>
import SpectralPowerDistributionEntry from './input/SpectralPowerDistributionEntry.vue';
import GlobalSettingsOptions from './GlobalSettingsOptions.vue';

import {Node} from "@/models/Node";
import {models, externals} from "@/models/nodetypes";


const props = defineProps({
	node: {
		type: Node,
		required: true,
	},
});
</script>

<template class="special-input">
	<SpectralPowerDistributionEntry v-if="node instanceof models.SpectralPowerDistributionNode"
			:node="node"
			v-model="node.distribution"
			v-model:datasetId="node.colorMatchingDataset" />
	<GlobalSettingsOptions v-else-if="node instanceof externals.DeviceTransformNode" />
</template>

<style lang="scss" scoped>
</style>