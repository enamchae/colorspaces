<script lang="ts" setup>
import {ref, inject, computed, onMounted, getCurrentInstance, ComputedRef} from "vue";

import NodeSocketField from "./NodeSocketField.vue";
import {tree} from "./store";

import {Socket, SocketType as St} from "@/models/Node";


const socketVue = getCurrentInstance()!.proxy;


const props = defineProps({
	socket: {
		type: Socket,
		required: true,
	},
});

const emit = defineEmits([
	"value-change",
	"drag-socket",
	"link-to-socket",
	"unlink",
]);

const draggedSocket = inject("draggedSocket") as ComputedRef<Socket>;


const shouldShowFields = computed(
	() => props.socket.isInput && !props.socket.hasLinks
);


const socketVues = inject("socketVues") as WeakMap<Socket, unknown>;
onMounted(() => {
	socketVues.set(props.socket, socketVue);
});

const socketHitbox = ref(null as any as HTMLDivElement);
const socketEl = computed(() => socketHitbox.value);

const rect = () => socketEl.value.getBoundingClientRect();

const socketPos = () => [
	(rect().left + rect().right) / 2,
	(rect().top + rect().bottom) / 2,
];


const unlinkLinks = () => {
	props.socket.links.forEach(link => tree.unlink(link));
	emit("unlink");
};



const ondragstart = (event: DragEvent) => {
	event.dataTransfer!.dropEffect = "link";
	event.dataTransfer!.setDragImage(document.createElement("div"), 0, 0);
	emit("drag-socket", socketVue);
};
const ondrop = (event: DragEvent) => {
	if (willAcceptLink()) {
		emit("link-to-socket", socketVue);
	}
};
const willAcceptLink = () => {
	// preemptive + stops TypeScript complaint
	if (!draggedSocket) throw new TypeError("Not currently dragging from a socket");

	const [src, dst] = props.socket.isOutput
			? [props.socket, draggedSocket.value]
			: [draggedSocket.value, props.socket];

	return props.socket.isInput !== draggedSocket.value.isInput
			&& props.socket.node !== draggedSocket.value.node
			&& Socket.canLinkTypeTo(src.type, dst.type);
};


const socketTypeColors = new Map([
	[St.Float, "#aaa"],
	[St.RgbRaw, "#75d"],
	[St.ColTransformed, "#dd3"],
	[St.RgbRawOrColTransformed, "linear-gradient(45deg, #75d 50%, #dd3 50%)"],
]);
const socketColor = computed(() => socketTypeColors.get(props.socket.type) ?? "");


defineExpose({
	socketEl,
	socketPos,
});

</script>

<template>
	<div class="socket-container"
			:class="{'in': socket.isInput}">
		<div class="socket"
				v-if="socket.showSocket"

				ref="socketHitbox"
				draggable="true"
				@dragstart="ondragstart"
				@dragenter.prevent
				@dragover.prevent
				@drop="ondrop"
				@pointerdown.stop

				@dblclick="unlinkLinks">
			<div class="socket-display"
					:style="{'--socket-color': socketColor} as any"></div>
		</div>
		{{socket.label}}

		<NodeSocketField v-if="shouldShowFields"
				:socket="socket" />
	</div>
</template>

<style lang="scss" scoped>
.socket-container {
	position: relative;
	margin-bottom: .25em;

	padding: 0 var(--socket-text-padding);

	--socket-text-padding: 8px;

	> .socket {
		--socket-box-size: 20px;
		--socket-size: 12px;
		--socket-offset: -12px;

		width: var(--socket-box-size);
		height: var(--socket-box-size);
		position: absolute;
		top: 0em;
		bottom: 0.5em;

		display: grid;
		place-items: center;
		
		> .socket-display {
			width: var(--socket-size);
			height: var(--socket-size);

			border-radius: 50%;
			background: var(--socket-color);
			box-shadow: 0 0 0 4px #2f3432;

			--socket-color: currentcolor;
		}
	}

	&.in {

		> .socket {
			left: var(--socket-offset);
		}
	}

	&:not(.in) {
		text-align: right;

		> .socket {
			right: var(--socket-offset);
		}
	}
}
</style>