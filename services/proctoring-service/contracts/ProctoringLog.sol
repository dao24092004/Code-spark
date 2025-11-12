// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

/**
 * @title ProctoringLog
 * @dev Smart contract này dùng để ghi lại các vi phạm nghiêm trọng trong kỳ thi
 * một cách bất biến trên blockchain.
 */
contract ProctoringLog {
    // Địa chỉ của service backend, chỉ địa chỉ này mới có quyền ghi log
    address public owner;

    // Định nghĩa cấu trúc cho một bản ghi vi phạm
    struct Violation {
        uint256 timestamp;      // Dấu thời gian xảy ra vi phạm
        string sessionId;       // ID của phiên thi
        string studentId;       // ID của sinh viên (tạm thời dùng string)
        string violationType;   // Loại vi phạm (ví dụ: 'phone_detected')
        string transactionHash; // Hash của giao dịch AI analysis (bằng chứng tham chiếu)
    }

    // Một mảng để lưu trữ tất cả các vi phạm
    Violation[] public allViolations;

    // Mapping để tra cứu các vi phạm theo sessionId
    mapping(string => uint[]) public violationsBySession;

    // Sự kiện (event) sẽ được phát ra mỗi khi một vi phạm được ghi lại
    event ViolationRecorded(
        uint256 violationId,
        uint256 timestamp,
        string sessionId,
        string studentId,
        string violationType
    );

    // Modifier để đảm bảo chỉ có owner (service backend) mới gọi được hàm
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function.");
        _;
    }

    // Hàm khởi tạo, được gọi một lần duy nhất khi deploy contract
    constructor() {
        owner = msg.sender; // Người deploy contract sẽ là owner ban đầu
    }

    /**
     * @dev Hàm chính để ghi một vi phạm mới lên blockchain.
     * Chỉ có owner mới có thể gọi hàm này.
     */
    function recordViolation(
        string memory _sessionId,
        string memory _studentId,
        string memory _violationType,
        string memory _transactionHash
    ) public onlyOwner {
        // Tạo một bản ghi vi phạm mới trong bộ nhớ
        Violation memory newViolation = Violation({
            timestamp: block.timestamp,
            sessionId: _sessionId,
            studentId: _studentId,
            violationType: _violationType,
            transactionHash: _transactionHash
        });

        // Thêm bản ghi mới vào mảng lưu trữ chung
        allViolations.push(newViolation);

        // Lấy ID của bản ghi vừa tạo (chính là chỉ số index của nó)
        uint256 violationId = allViolations.length - 1;

        // Thêm ID này vào danh sách các vi phạm của phiên thi tương ứng
        violationsBySession[_sessionId].push(violationId);

        // Phát ra sự kiện để các ứng dụng bên ngoài có thể lắng nghe
        emit ViolationRecorded(
            violationId,
            block.timestamp,
            _sessionId,
            _studentId,
            _violationType
        );
    }

    /**
     * @dev Hàm để lấy thông tin chi tiết của một vi phạm bằng ID.
     */
    function getViolationById(uint256 _violationId) public view returns (Violation memory) {
        require(_violationId < allViolations.length, "Violation ID out of bounds.");
        return allViolations[_violationId];
    }

    /**
     * @dev Hàm để lấy danh sách ID các vi phạm của một phiên thi.
     */
    function getViolationIdsBySession(string memory _sessionId) public view returns (uint[] memory) {
        return violationsBySession[_sessionId];
    }
}