// file: src/contracts/GradeLedger.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GradeLedger {
    struct GradeRecord {
        string submissionId; // Vẫn lưu string để dễ đọc
        uint userId;
        uint score;
        uint timestamp;
    }

    // <<< THAY ĐỔI 1: Đổi key từ string sang bytes32 >>>
    mapping(bytes32 => GradeRecord) public grades;

    event GradeRecorded(
        bytes32 indexed submissionIdHash, // Event cũng dùng bytes32
        uint indexed userId,
        uint score
    );

    // <<< THAY ĐỔI 2: Hàm nhận vào bytes32 thay vì string >>>
    function recordGrade(bytes32 _submissionIdHash, uint _userId, uint _score, string memory _submissionId) public {
        grades[_submissionIdHash] = GradeRecord({
            submissionId: _submissionId, // Lưu lại submissionId gốc
            userId: _userId,
            score: _score,
            timestamp: block.timestamp
        });
        emit GradeRecorded(_submissionIdHash, _userId, _score);
    }
}