
const { Web3 } = require('web3')
const fs = require('fs-extra')

// PUBLIC ETHEREUM NETWORK
const sourcePublic = JSON.parse(
    fs.readFileSync(process.env.ETH_VERIFICATION_CONTRACT_PATH, 'utf8')
)
const abiPublic = sourcePublic.abi
const web3Public = new Web3(process.env.ETH_VERIFICATION_INFURA_URL)
const contractAddressPublic = process.env.ETH_VERIFICATION_CONTRACT_ADDRESS
const contractPublic = new web3Public.eth.Contract(
    abiPublic,
    contractAddressPublic
)

// PRIVATE ETHEREUM NETWORK
const sourcePrivate = JSON.parse(
    fs.readFileSync(process.env.ETH_STORAGE_CONTRACT_PATH, 'utf8')
)
const abiPrivate = sourcePrivate.abi

// PRIVATE ETHEREUM NETWORK 1
const web3Private1 = new Web3(process.env.ETH_STORAGE_INFURA_URL_1)
const contractAddressPrivate1 = process.env.ETH_STORAGE_CONTRACT_ADDRESS_1
const contractPrivate1 = new web3Private1.eth.Contract(
    abiPrivate,
    contractAddressPrivate1
)

// PRIVATE ETHEREUM NETWORK 2
const web3Private2 = new Web3(process.env.ETH_STORAGE_INFURA_URL_2)
const contractAddressPrivate2 = process.env.ETH_STORAGE_CONTRACT_ADDRESS_2
const contractPrivate2 = new web3Private2.eth.Contract(
    abiPrivate,
    contractAddressPrivate2
)

// PRIVATE ETHEREUM NETWORK 3
const web3Private3 = new Web3(process.env.ETH_STORAGE_INFURA_URL_3)
const contractAddressPrivate3 = process.env.ETH_STORAGE_CONTRACT_ADDRESS_3
const contractPrivate3 = new web3Private3.eth.Contract(
    abiPrivate,
    contractAddressPrivate3
)

// Simpan node dalam array dengan counter antrian
const privateNodes = [
    {
        position: 1,
        web3: web3Private1,
        contractAddress: contractAddressPrivate1,
        contract: contractPrivate1,
        privateKey: process.env.ETH_STORAGE_KEY_1,
        queue: 0,
        nonce: 0,
    },
    {
        position: 2,
        web3: web3Private2,
        contractAddress: contractAddressPrivate2,
        contract: contractPrivate2,
        privateKey: process.env.ETH_STORAGE_KEY_2,
        queue: 0,
        nonce: 0,
    },
    {
        position: 3,
        web3: web3Private3,
        contractAddress: contractAddressPrivate3,
        contract: contractPrivate3,
        privateKey: process.env.ETH_STORAGE_KEY_3,
        queue: 0,
        nonce: 0,
    },
]

const publicNode = {
    web3: web3Public,
    contractAddress: contractAddressPublic,
    contract: contractPublic,
}

let rrIndex = 0
// Round Robin untuk memilih node private
exports.getBestPrivate = function () {
    // Pilih node dengan antrian terkecil
    // let bestIndex = 0
    // let minQueue = privateNodes[0].queue
    // for (let i = 1; i < privateNodes.length; i++) {
    //     if (privateNodes[i].queue < minQueue) {
    //         minQueue = privateNodes[i].queue
    //         bestIndex = i
    //     }
    // }
    // // Tambah antrian saat node dipilih
    // privateNodes[bestIndex].queue++
    // console.log(
    //     `[NODE PICKED] Transaksi dikirim ke Node ${privateNodes[bestIndex].position}`
    // )
    // // Kembalikan node terbaik + fungsi untuk decrement queue setelah request selesai
    // return {
    //     web3: privateNodes[bestIndex].web3,
    //     contract: privateNodes[bestIndex].contract,
    //     contractAddress: privateNodes[bestIndex].contractAddress,
    //     privateKey: privateNodes[bestIndex].privateKey,
    //     position: privateNodes[bestIndex].position,
    //     queue: privateNodes[bestIndex].queue,
    //     done: () => {
    //         privateNodes[bestIndex].queue = Math.max(
    //             0,
    //             privateNodes[bestIndex].queue - 1
    //         )
    //     },
    // }

    // Pemilihan node dengan round robin
    const currentIndex = rrIndex % privateNodes.length
    const selectedNode = privateNodes[currentIndex]

    // Tingkatkan indeks untuk pemanggilan berikutnya
    rrIndex++

    // Tingkatkan penghitung antrian
    selectedNode.queue++

    console.log(
        `[NODE PICKED - ROUND ROBIN] Transaksi dikirim ke Node ${selectedNode.position}`
    )

    // Kembalikan node dengan fungsi done
    return {
        web3: selectedNode.web3,
        contract: selectedNode.contract,
        contractAddress: selectedNode.contractAddress,
        privateKey: selectedNode.privateKey,
        position: selectedNode.position,
        queue: selectedNode.queue,
        done: () => {
            selectedNode.queue = Math.max(0, selectedNode.queue - 1)
        },
    }

    //   Pemilihan node dengan random
    // const randomIndex = Math.floor(Math.random() * privateNodes.length)
    // const node = privateNodes[randomIndex]
    // node.queue++
    // console.log(
    //     `[NODE PICKED - RANDOM] Transaksi dikirim ke Node ${node.position}`
    // )
    // return {
    //     web3: node.web3,
    //     contract: node.contract,
    //     contractAddress: node.contractAddress,
    //     privateKey: node.privateKey,
    //     position: node.position,
    //     queue: node.queue,
    //     done: () => {
    //         node.queue = Math.max(0, node.queue - 1)
    //     },
    // }
}

exports.getPublic = function () {
    return publicNode
}

// exports.initWeb3 = function() {
//     const bestPrivateNode = exports.getBestPrivate();

//     return {
//         publicNode,
//         privateNode: bestPrivateNode
//     }
// }

exports.privateGetEthAddress = function (nodePrivate) {
    try {
        const account = nodePrivate.web3.eth.accounts.privateKeyToAccount(
            nodePrivate.privateKey
        )
        return account.address
    } catch (e) {
        console.log(e)
        return ''
    }
}

exports.privateSendTransaction = async function (data) {
    const txHashes = []
    let isValid = true

    for (const node of privateNodes) {
        try {
            node.queue++
            const account = node.web3.eth.accounts.privateKeyToAccount(
                node.privateKey
            )
            const ethAddress = account.address

            const targetNonce = await node.web3.eth.getTransactionCount(
                ethAddress,
                'pending'
            )
            if (node.nonce < targetNonce) {
                node.nonce = targetNonce
            }
            // const currentNonce = node.nonce
            // node.nonce++

            // Estimasi gas untuk deployment
            const deployOptions = {
                data: data,
            }

            const estimatedGas = await node.contract
                .deploy(deployOptions)
                .estimateGas({ from: ethAddress })
            const adjustEstimatedGas = Math.floor(Number(estimatedGas)) // +20% to avoid underpriced tx

            const gasPrice = await node.web3.eth.getGasPrice()
            const adjustedGasPrice = Math.floor(Number(gasPrice)) // +20% to avoid underpriced tx

            // const nonce = await node.web3.eth.getTransactionCount(ethAddress, 'pending');
            // console.log("Nonce:", nonce);

            const txData = {
                from: ethAddress,
                to: node.contractAddress,
                gas: adjustEstimatedGas,
                gasPrice: adjustedGasPrice,
                data: data,
                // nonce: currentNonce,
            }

            // Tanda tangani transaksi
            const signedTx = await node.web3.eth.accounts.signTransaction(
                txData,
                node.privateKey
            )
            // Kirim transaksi ke jaringan Ethereum
            const receipt = await node.web3.eth.sendSignedTransaction(
                signedTx.rawTransaction
            )
            node.queue = Math.max(0, node.queue - 1)

            txHashes.push(receipt.transactionHash)
        } catch (e) {
            console.log(`Error on node ${node.web3.currentProvider.host}:`, e)
            node.queue = Math.max(0, node.queue - 1)
            isValid = false
        }
    }

    if (!isValid) {
        return false
    }
    return txHashes
}

exports.publicSendTransaction = async function (web3Public, privateKey, data) {
    try {
        const account = web3Public.eth.accounts.privateKeyToAccount(privateKey)
        const ethAddress = account.address

        const gasPrice = await web3Public.eth.getGasPrice()
        const txData = {
            from: ethAddress,
            to: process.env.ETH_VERIFICATION_CONTRACT_ADDRESS,
            gasPrice: gasPrice,
            data,
        }

        // Tanda tangani transaksi
        const signedTx = await web3Public.eth.accounts.signTransaction(
            txData,
            privateKey
        )
        // Kirim transaksi ke jaringan Ethereum
        const receipt = await web3Public.eth.sendSignedTransaction(
            signedTx.rawTransaction
        )
        console.log(receipt)
        return true
    } catch (e) {
        console.log(e)
        return false
    }
}
