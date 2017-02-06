package selenium.tests;

import static org.junit.Assert.*;

import java.util.List;
import java.util.concurrent.TimeUnit;

import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Keys;
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.htmlunit.HtmlUnitDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import io.github.bonigarcia.wdm.ChromeDriverManager;

public class SeleniumBotTest
{
  	private static WebDriver driver;
	
	@BeforeClass
	public static void setUp() throws Exception 
	{
		//driver = new HtmlUnitDriver();
		ChromeDriverManager.getInstance().setup();
		driver = new ChromeDriver();
		driver.get("https://my-private-teamgroup.slack.com/");

		// Wait until page loads and we can see a sign in button.
		WebDriverWait wait = new WebDriverWait(driver, 30);
		wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("signin_btn")));

		// Find email and password fields.
		WebElement email = driver.findElement(By.id("email"));
		WebElement pw = driver.findElement(By.id("password"));

		// Type in our test user login info.
		email.sendKeys("username@domain.email");
		pw.sendKeys("password");

		// Click
		WebElement signin = driver.findElement(By.id("signin_btn"));
		signin.click();
		
		// Wait until we go to general channel.
		wait.until(ExpectedConditions.titleContains("general"));
		
		// Switch to #bots channel and wait for it to load.
		driver.get("https://my-private-teamgroup.slack.com/messages/@robotan/");
		wait.until(ExpectedConditions.titleContains("robotan"));
	}
	
	@AfterClass
	public static void  tearDown() throws Exception
	{
		driver.close();
		driver.quit();
	}

	
	@Test
	public void getlistofissues()
	{
		WebDriverWait wait = new WebDriverWait(driver, 30);

		// Type something
		WebElement messageBot = driver.findElement(By.id("message-input"));
		messageBot.sendKeys("give me issues");
		messageBot.sendKeys(Keys.RETURN);

		wait.withTimeout(5, TimeUnit.SECONDS).ignoring(StaleElementReferenceException.class);

		WebElement msg = driver.findElement(By.xpath("//span[@class='message_body' and contains(text(),'Here are some open issues:')]"));
		assertNotNull(msg);
	}
	
	@Test
	public void getdeadlines()
	{
		WebElement msg = null;
		WebDriverWait wait = new WebDriverWait(driver, 30);
		
		// Type something
		WebElement messageBot = driver.findElement(By.id("message-input"));
		messageBot.sendKeys("deadline for sgarg7");
		messageBot.sendKeys(Keys.RETURN);

		wait.withTimeout(5, TimeUnit.SECONDS).ignoring(StaleElementReferenceException.class);
		WebElement x = null;
		msg = driver.findElement(By.xpath("//span[@class='message_body' and contains(text(),'Deadlines are')]"));
		assertNotNull(msg);
	}
	
	@Test
	public void gethelp()
	{
		WebDriverWait wait = new WebDriverWait(driver, 30);

		// Type something
		WebElement messageBot = driver.findElement(By.id("message-input"));
		messageBot.sendKeys("help me with issue #2");
		messageBot.sendKeys(Keys.RETURN);

		wait.withTimeout(5, TimeUnit.SECONDS).ignoring(StaleElementReferenceException.class);

		WebElement msg = driver.findElement(By.xpath("//span[@class='message_body' and contains(text(),'find anyone to help you')]"));
		assertNotNull(msg);
	}
}
