<template>
	<vue-final-modal v-slot="{ close }" v-bind="$attrs">
		<div class="modal-body">
			<div v-if="step === 1">
				<h3>Withdraw funds</h3>
				<transaction :hash="withdrawalTxHash" :error="withdrawalTxError" @close="close()"></transaction>
			</div>
			<div v-if="step === 2">
				<h3>Success!</h3>
				<div>You have successfully withdrawn your contribution.</div>
				<button class="btn close-btn" @click="close()">OK</button>
			</div>
		</div>
	</vue-final-modal>
</template>

<script lang="ts">
export default {
	inheritAttrs: false,
}
</script>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { BigNumber } from 'ethers'
// @ts-ignore
import { VueFinalModal } from 'vue-final-modal'
import { withdrawContribution } from '@/api/contributions'
import Transaction from '@/components/Transaction.vue'
import { formatAmount as _formatAmount } from '@/utils/amounts'
import { waitForTransaction } from '@/utils/contracts'
import { useAppStore, useUserStore } from '@/stores'

const appStore = useAppStore()
const userStore = useUserStore()
const { currentUser } = storeToRefs(userStore)

const step = ref(1)
const withdrawalTxHash = ref('')
const withdrawalTxError = ref('')

onMounted(async () => {
	await withdraw()
})

function formatAmount(value: BigNumber): string {
	const { nativeTokenDecimals } = appStore.currentRound!
	return _formatAmount(value, nativeTokenDecimals)
}

async function withdraw() {
	const signer = currentUser.value!.walletProvider.getSigner()
	const { fundingRoundAddress } = appStore.currentRound!
	try {
		await waitForTransaction(
			withdrawContribution(fundingRoundAddress, signer),
			hash => (withdrawalTxHash.value = hash),
		)
	} catch (error) {
		withdrawalTxError.value = error.message
		return
	}
	appStore.setContribution(BigNumber.from(0))
	step.value += 1
}
</script>

<style scoped lang="scss">
@import '../styles/vars';

.close-btn {
	margin-top: $modal-space;
}
</style>
