const sanitizeHtml = require("sanitize-html");

class ContentFilter {
  // Advanced spam detection patterns
  static get spamPatterns() {
    return {
      // URL patterns - more comprehensive
      urls: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi,
        /www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/gi,
        /[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/[^\s]*/gi,
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, // Email addresses
        /\b[a-zA-Z0-9.-]+\.(com|org|net|edu|gov|mil|info|biz|io|co|us|uk|ca|au|de|fr|jp|cn|ru|br|in|mx|es|it|nl|se|no|fi|dk|pl|cz|hu|ro|bg|gr|pt|ie|at|ch|be|lu)\b/gi,
        // Pattern for xx.xx format and obscure TLDs
        /\b[a-zA-Z0-9-]{2,20}\.(xyz|fit|top|site|online|tech|store|shop|app|dev|web|cloud|space|website|club|fun|game|live|stream|video|photo|pic|img|art|design|studio|agency|company|business|services|solutions|systems|network|tech|software|app|mobile|phone|tablet|computer|laptop|desktop|server|host|domain|website|site|page|blog|news|media|content|social|chat|message|mail|email|contact|info|data|file|download|upload|share|link|url|web|net|online|digital|virtual|cyber|secure|safe|protect|guard|shield|defense|security|privacy|anonymous|proxy|vpn|tor|dark|deep|hidden|secret|private|exclusive|vip|premium|pro|plus|gold|silver|platinum|diamond|elite|luxury|fancy|cool|awesome|amazing|incredible|fantastic|perfect|best|top|quality|professional|expert|certified|licensed|insured|affordable|reliable|trusted|approved|verified)\b/gi,
        // Generic xx.xx pattern for any 2-20 letter domain with 2-6 letter TLD
        /\b[a-zA-Z0-9-]{2,20}\.[a-zA-Z]{2,6}\b/gi,
      ],

      // Promotional/spam keywords
      promotional: [
        /\b(buy|sell|offer|deal|discount|cheap|price|cost|free|trial|sample|promo|coupon|voucher|sale|clearance|bargain|save|special|limited|exclusive|guarantee|warranty|refund|money\.?back)\b/gi,
        /\b(click|visit|check|shop|order|purchase|download|subscribe|register|sign\.?up|join|follow|like|share|comment|contact|call|text|whatsapp|telegram|discord|skype)\b/gi,
        /\b(awesome|amazing|incredible|fantastic|perfect|best|top|quality|professional|expert|certified|licensed|insured|affordable|reliable|trusted|approved|verified)\b/gi,
        /\b(urgent|immediate|instant|quick|fast|easy|simple|hassle\.?free|risk\.?free|100%|satisfaction|guaranteed|proven|effective|powerful|revolutionary|breakthrough)\b/gi,
      ],

      // Contact information
      contact: [
        /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // Phone numbers
        /\b\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g, // International format
        /\b(whatsapp|telegram|signal|viber|wechat|line|kik|snapchat|instagram|facebook|twitter|youtube|tiktok|linkedin|pinterest|reddit)\b/gi,
      ],

      // Repetitive content
      repetitive: [
        /(.)\1{4,}/g, // 5+ repeated characters
        /\b(\w+)(\s+\1){2,}/gi, // Repeated words
        /[!@#$%^&*]{3,}/g, // Excessive special characters
      ],

      // Suspicious patterns
      suspicious: [
        /\b(hello|hi|dear|friend|sir|madam|attention|notice|important|congratulations|winner|lottery|prize|reward|bonus|gift|claim|collect|receive)\b.*\b(money|cash|dollar|euro|pound|currency|payment|transfer|deposit|investment|profit|income|earn|make|get)\b/gi,
        /\b(viagra|cialis|levitra|pharmacy|medication|drug|pill|weight\.?loss|diet|fat\.?burn|muscle|fitness|bodybuilding|supplement|vitamin|herbal|natural|organic)\b/gi,
      ],

      // Obscure websites - specifically targets xx.xx format with unusual TLDs
      obscureWebsites: [
        /\b[a-zA-Z0-9-]{2,20}\.(xyz|fit|top|site|online|tech|store|shop|app|dev|web|cloud|space|website|club|fun|game|live|stream|video|photo|pic|img|art|design|studio|agency|company|business|services|solutions|systems|network|tech|software|app|mobile|phone|tablet|computer|laptop|desktop|server|host|domain|website|site|page|blog|news|media|content|social|chat|message|mail|email|contact|info|data|file|download|upload|share|link|url|web|net|online|digital|virtual|cyber|secure|safe|protect|guard|shield|defense|security|privacy|anonymous|proxy|vpn|tor|dark|deep|hidden|secret|private|exclusive|vip|premium|pro|plus|gold|silver|platinum|diamond|elite|luxury|fancy|cool|awesome|amazing|incredible|fantastic|perfect|best|top|quality|professional|expert|certified|licensed|insured|affordable|reliable|trusted|approved|verified)\b/gi,
      ],
    };
  }

  // Enhanced HTML sanitization
  static sanitizeContent(content) {
    return sanitizeHtml(content, {
      allowedTags: [], // No HTML tags allowed
      allowedAttributes: {},
      allowedIframeHostnames: [],
      textFilter: function (text) {
        // Remove invisible characters and zero-width spaces
        return text.replace(/[\u200B-\u200D\uFEFF]/g, "");
      },
    });
  }

  // Check for spam patterns
  static detectSpam(content) {
    const results = {
      isSpam: false,
      reasons: [],
      score: 0,
      details: {},
    };

    // Check each spam category
    Object.keys(this.spamPatterns).forEach((category) => {
      const patterns = this.spamPatterns[category];
      let matches = [];

      patterns.forEach((pattern) => {
        const found = content.match(pattern);
        if (found) {
          matches = matches.concat(found);
        }
      });

      if (matches.length > 0) {
        results.details[category] = matches;
        results.reasons.push(`${category}: ${matches.length} matches`);

        // Score based on category severity
        switch (category) {
          case "urls":
            results.score += matches.length * 3;
            break;
          case "promotional":
            results.score += matches.length * 2;
            break;
          case "contact":
            results.score += matches.length * 4;
            break;
          case "repetitive":
            results.score += matches.length * 1;
            break;
          case "suspicious":
            results.score += matches.length * 5;
            break;
          case "obscureWebsites":
            results.score += matches.length * 8; // High score for obscure websites
            break;
        }
      }
    });

    // Additional checks
    if (content.length < 10) {
      results.reasons.push("Content too short");
      results.score += 2;
    }

    if (content.length > 2000) {
      results.reasons.push("Content too long");
      results.score += 1;
    }

    // Check for excessive capitalization
    const upperCaseRatio =
      (content.match(/[A-Z]/g) || []).length / content.length;
    if (upperCaseRatio > 0.5) {
      results.reasons.push("Excessive capitalization");
      results.score += 2;
    }

    // Determine if it's spam (score threshold: 3)
    // Note: We flag all spam for admin review instead of blocking
    results.isSpam = results.score >= 3; // Lowered from 5 to 3

    return results;
  }

  // Main content validation function
  static validateReview(content) {
    // First sanitize HTML
    const sanitizedContent = this.sanitizeContent(content);

    // Then check for spam
    const spamCheck = this.detectSpam(sanitizedContent);

    return {
      originalContent: content,
      sanitizedContent: sanitizedContent,
      isSpam: spamCheck.isSpam,
      reasons: spamCheck.reasons,
      score: spamCheck.score,
      details: spamCheck.details,
    };
  }

  // Generate user-friendly error message
  static getSpamErrorMessage(validation) {
    if (!validation.isSpam) return null;

    const mainReasons = validation.reasons.slice(0, 3).join(", ");
    return `Review appears to be spam: ${mainReasons}. Please keep reviews relevant and avoid promotional content.`;
  }
}

module.exports = ContentFilter;
