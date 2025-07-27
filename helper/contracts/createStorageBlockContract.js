// node helper/contracts/createBlockContract.js

require('dotenv').config()
const { Web3 } = require('web3')
const fs = require('fs-extra')

async function deployPrivateContract(position, url, privateKey, contractPath) {
    console.log(`\n\nMendeploy kontrak storage health records ${position}...`)

    try {
        const web3 = new Web3(url)

        const ethPrivateKey = privateKey

        if (!ethPrivateKey) {
            throw new Error(
                'ETH_STORAGE_KEY tidak ditemukan di environment variables.'
            )
        }

        // Inisialisasi akun dengan private key
        const account = web3.eth.accounts.privateKeyToAccount(ethPrivateKey)
        web3.eth.accounts.wallet.add(account)
        web3.eth.defaultAccount = account.address

        console.log('Akun Ethereum:', account.address)

        // Baca file kontrak secara async
        const source = JSON.parse(fs.readFileSync(contractPath, 'utf8'))

        if (!source.abi || !source.bytecode) {
            throw new Error(
                'Data ABI atau Bytecode tidak tersedia di file kontrak.'
            )
        }

        const { abi, bytecode } = source

        // Deploy kontrak
        console.log('Mendeploy kontrak...')
        const contract = new web3.eth.Contract(abi)

        // Estimasi gas untuk deployment
        const deployOptions = {
            data: bytecode,
        }
        const estimatedGas = await contract
            .deploy(deployOptions)
            .estimateGas({ from: account.address })
        const gasPrice = await web3.eth.getGasPrice()

        console.log('Estimated gas:', estimatedGas.toString())
        console.log('Gas price:', gasPrice.toString())

        const contractInstance = await contract
            .deploy({ data: bytecode })
            .send({
                from: account.address,
                gas: estimatedGas.toString(),
                gasPrice: gasPrice.toString(),
                // gasPrice: 0,
                value: '0x0', // Tidak mengirim Ether saat deploy
            })

        const contractAddress = contractInstance.options.address
        console.log('Kontrak berhasil dideploy di:', contractAddress)

        // Simpan alamat kontrak ke file address.txt
        const saveLocation = `./helper/contracts/STORAGE_CONTRACT_ADDRESS_${position}.txt`
        fs.writeFileSync(saveLocation, contractAddress)
        console.log(`Alamat kontrak disimpan ke: ${saveLocation}`)
    } catch (error) {
        console.error('Terjadi kesalahan:', error.message)
    }
}

;(async () => {
    // Konfigurasi 1
    await deployPrivateContract(
        1,
        process.env.ETH_STORAGE_INFURA_URL_1,
        process.env.ETH_STORAGE_KEY_1,
        process.env.ETH_STORAGE_CONTRACT_PATH
    )

    // Konfigurasi 2
    await deployPrivateContract(
        2,
        process.env.ETH_STORAGE_INFURA_URL_2,
        process.env.ETH_STORAGE_KEY_2,
        process.env.ETH_STORAGE_CONTRACT_PATH
    )

    // Konfigurasi 3
    await deployPrivateContract(
        3,
        process.env.ETH_STORAGE_INFURA_URL_3,
        process.env.ETH_STORAGE_KEY_3,
        process.env.ETH_STORAGE_CONTRACT_PATH
    )
})()
