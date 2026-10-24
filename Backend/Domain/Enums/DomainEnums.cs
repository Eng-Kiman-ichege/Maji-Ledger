namespace MajiLedger.Domain.Enums;

public enum MeterStatus
{
    Active = 1,
    Inactive = 2,
    Suspended = 3,
    Decommissioned = 4
}

public enum TenancyStatus
{
    Active = 1,
    Ended = 2,
    Suspended = 3
}

public enum PaymentStatus
{
    Pending = 1,
    Confirmed = 2,
    Failed = 3,
    Reversed = 4
}

public enum TokenStatus
{
    Issued = 1,
    Delivered = 2,
    DeliveryFailed = 3
}

public enum PaymentChannel
{
    MpesaPaybill = 1,
    AirtelMoneyPaybill = 2,
    ScanToPay = 3,
    Ussd = 4
}

public enum PropertyType
{
    Residential = 1,
    Commercial = 2,
    Mixed = 3
}
