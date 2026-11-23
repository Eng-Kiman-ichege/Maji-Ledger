using FluentAssertions;
using MajiLedger.Infrastructure.Security;
using Xunit;

namespace MajiLedger.Tests.Foundation;

public class PasswordSecurityTests
{
    private readonly PasswordHasher _hasher = new();

    [Fact]
    public void PasswordHasher_GeneratesSaltedHash_FormatIsValid()
    {
        var password = "SecurePassword123!";
        var hash = _hasher.HashPassword(password);

        hash.Should().NotBeNullOrWhiteSpace();
        var parts = hash.Split('.');
        parts.Length.Should().Be(3); // salt.iterations.hash

        Convert.FromBase64String(parts[0]).Length.Should().Be(16); // 128-bit salt
        int.Parse(parts[1]).Should().Be(100_000); // Iterations
        Convert.FromBase64String(parts[2]).Length.Should().Be(32); // 256-bit key
    }

    [Fact]
    public void PasswordHasher_VerifyPassword_SucceedsForValidPassword()
    {
        var password = "CorrectHorseBatteryStaple!";
        var hash = _hasher.HashPassword(password);

        var isValid = _hasher.VerifyPassword(password, hash);
        isValid.Should().BeTrue();
    }

    [Fact]
    public void PasswordHasher_VerifyPassword_FailsForIncorrectPassword()
    {
        var password = "OriginalPassword!";
        var hash = _hasher.HashPassword(password);

        var isValid = _hasher.VerifyPassword("WrongPassword!", hash);
        isValid.Should().BeFalse();
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData(null)]
    public void PasswordHasher_VerifyPassword_FailsForEmptyOrWhitespace(string? invalidPassword)
    {
        var hash = _hasher.HashPassword("Test1234!");
        var isValid = _hasher.VerifyPassword(invalidPassword!, hash);
        isValid.Should().BeFalse();
    }

    [Fact]
    public void PasswordHasher_PasswordsAreNotPlaintext_AndTwoHashesOfSamePasswordAreDifferentDueToSalt()
    {
        var password = "DeterministicInputPassword!";
        var hash1 = _hasher.HashPassword(password);
        var hash2 = _hasher.HashPassword(password);

        hash1.Should().NotContain(password);
        hash2.Should().NotContain(password);
        hash1.Should().NotBe(hash2); // Unique random salts
    }
}
