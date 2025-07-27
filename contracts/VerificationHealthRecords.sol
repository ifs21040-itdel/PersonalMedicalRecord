// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VerificationHealthRecords {
    // Data untuk catatan kesehatan
    struct HealthRecordVerification {
        string id;       // id catatan kesehatan
        address owner;   // address pemilik catatan kesehatan
    string txHash1;   // hash transaksi
    }

    struct SenderVerification {
        HealthRecordVerification[] verifications;
    }
    
    // Events
    event AddedHealthRecordVerification(address creator); 

    // Mapping
    mapping(address => SenderVerification) private senderVerifications;
    mapping(address => mapping(string => bool)) private isVerification;

    // Melakukan pendaftaran user
    function addVerification(
        string memory id, 
        address ownerAddress,
        string memory txHash
    ) public {
        require(!isVerification[msg.sender][id], "ID sudah terverifikasi");
        // Periksa apakah pengirim adalah creator

        senderVerifications[msg.sender].verifications.push(
            HealthRecordVerification({
                id: id,
                owner: ownerAddress,
                txHash: txHash
            })
        );

        isVerification[msg.sender][id] = true;

        emit AddedHealthRecordVerification(msg.sender);
    }

    // Periksa apakah ID sudah terverifikasi
    function checkIsVerification(string memory id, address creator) public view returns (bool) {
        return isVerification[creator][id];
    }

    // Fungsi ini hanya untuk tujuan pengujian
    event SendTest(address creator, string message); 
    function testSendTransaction(string memory message) public {
        emit SendTest(msg.sender, message);
    }
}
