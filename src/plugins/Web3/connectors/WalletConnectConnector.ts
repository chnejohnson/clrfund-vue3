import WalletConnectProvider from '@walletconnect/web3-provider'

export default {
	// TODO: add better return type
	connect: async (): Promise<any | undefined> => {
		const provider = new WalletConnectProvider({
			infuraId: import.meta.env.VITE_INFURA_ID,
			rpc: {
				[import.meta.env.VITE_ETHEREUM_API_CHAINID!]: import.meta.env.VITE_ETHEREUM_API_URL!,
			},
		})

		let accounts, chainId
		try {
			accounts = await provider.enable()
			chainId = await provider.request({ method: 'eth_chainId' })
		} catch (err) {
			if (err.code === 4001) {
				// EIP-1193 userRejectedRequest error
				// If this happens, the user rejected the connection request.
				/* eslint-disable-next-line no-console */
				console.log('Please connect to WalletConnect.')
			} else {
				/* eslint-disable-next-line no-console */
				console.error(err)
				return
			}
		}

		return {
			provider,
			accounts,
			chainId: Number(chainId),
		}
	},
}
